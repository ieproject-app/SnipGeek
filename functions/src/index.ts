
'use server';
/**
 * @fileoverview Backend function for handling PDF compression.
 * This version calls Ghostscript directly via child_process.exec for maximum reliability.
 * It uses a single, balanced compression setting for simplicity and effectiveness.
 */

import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { exec } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

// Initialize Firebase Admin SDK if not already initialized
try {
    initializeApp();
} catch (e) {
    logger.info("Firebase Admin SDK already initialized.");
}

const storage = getStorage();
const COMPRESSED_FOLDER = "compressed";
const GS_SETTINGS = '-dPDFSETTINGS=/ebook'; // Use a balanced setting for good results

// Resource options MUST be set here for Cloud Functions.
export const processPdfOnCall = onCall({
    memory: '1GiB',
    timeoutSeconds: 540,
    cpu: 1,
    region: 'asia-southeast2',
}, async (request: CallableRequest<{ originalFilePath: string; }>) => {
    
    // Use the default bucket for the project. This is the most reliable way.
    const bucket = storage.bucket();

    // 1. Validate the request from the frontend
    const { originalFilePath } = request.data;
    if (!originalFilePath) {
        logger.error('Function called without "originalFilePath" argument.', { data: request.data });
        throw new HttpsError('invalid-argument', 'The function must be called with the "originalFilePath" argument.');
    }
    
    logger.log(`Processing requested for: gs://${bucket.name}/${originalFilePath}`);
    
    const tempDir = os.tmpdir();
    
    // Create a unique name to avoid conflicts and issues with special characters
    const originalFileName = path.basename(originalFilePath).replace(/[^a-zA-Z0-9._-]/g, '');
    const uniqueId = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    const outputFileName = `compressed_${uniqueId}_${originalFileName}`;
    
    const tempInputPath = path.join(tempDir, `original_${uniqueId}_${originalFileName}`);
    const tempOutputPath = path.join(tempDir, outputFileName);

    try {
        // 2. Download the original uploaded file from storage
        logger.log(`Downloading gs://${bucket.name}/${originalFilePath} to ${tempInputPath}...`);
        await bucket.file(originalFilePath).download({ destination: tempInputPath });
        logger.log('Download complete.');

        // 3. Execute the Ghostscript command
        const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 ${GS_SETTINGS} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${tempOutputPath}" "${tempInputPath}"`;
        
        logger.log('Executing Ghostscript command:', gsCommand);
        await new Promise<void>((resolve, reject) => {
            exec(gsCommand, (error, stdout, stderr) => {
                if (error) {
                    logger.error("Ghostscript execution error:", {
                        message: error.message,
                        stack: error.stack,
                        stdout,
                        stderr
                    });
                    return reject(new HttpsError('internal', `Ghostscript processing failed. STDERR: ${stderr || 'N/A'}.`));
                }
                logger.log("Ghostscript stdout:", stdout);
                if (stderr) {
                   logger.warn("Ghostscript stderr (non-fatal):", stderr);
                }
                resolve();
            });
        });
        logger.log('Ghostscript command successful.');

        // 4. Upload the newly compressed file
        const destinationPath = `${COMPRESSED_FOLDER}/${outputFileName}`;
        logger.log(`Uploading processed file to gs://${bucket.name}/${destinationPath}...`);
        
        await bucket.upload(tempOutputPath, {
            destination: destinationPath,
            metadata: { 
                contentType: 'application/pdf',
                metadata: { originalPath: originalFilePath }
            },
        });
        
        logger.log('Upload of processed file complete.');

        // 5. Get the download URL for the new file and return it
        const [url] = await bucket.file(destinationPath).getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // 1 hour
        });
        
        const [metadata] = await bucket.file(destinationPath).getMetadata();
        const newSize = metadata.size;

        logger.log(`Successfully processed file. New size: ${newSize}, URL: ${url}`);
        return { downloadUrl: url, newSize };

    } catch (error: any) {
        logger.error("Error during compression pipeline:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        if (error instanceof HttpsError) {
            throw error;
        }
        // Fallback for any other unexpected errors
        throw new HttpsError('internal', 'An unexpected error occurred during the compression pipeline.', { details: error.message });
    } finally {
        // 6. Cleanup temporary files, ensuring it doesn't crash if files don't exist
        logger.log("Cleaning up temporary files...");
        try {
            await fs.unlink(tempInputPath);
        } catch (cleanupError: any) {
            if (cleanupError.code !== 'ENOENT') {
                logger.warn("Failed to cleanup temporary input file:", cleanupError);
            }
        }
        try {
            await fs.unlink(tempOutputPath);
        } catch (cleanupError: any) {
            if (cleanupError.code !== 'ENOENT') {
                logger.warn("Failed to cleanup temporary output file:", cleanupError);
            }
        }
    }
});
