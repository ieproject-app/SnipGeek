
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";

export function ChangelogDialog() {
  const { t } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto p-0 text-xs text-muted-foreground">
          v1.2.0
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('changelogTitle')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {t('changelog-v1.2.0-title')} <Badge>Latest</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{t('changelog-v1.2.0-date')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('changelog-v1.2.0-item1')}</li>
                <li>{t('changelog-v1.2.0-item2')}</li>
                <li>{t('changelog-v1.2.0-item3')}</li>
                <li>{t('changelog-v1.2.0-item4')}</li>
                <li>{t('changelog-v1.2.0-item5')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {t('changelog-v1.1.0-title')}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{t('changelog-v1.1.0-date')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('changelog-v1.1.0-item1')}</li>
                <li>{t('changelog-v1.1.0-item2')}</li>
                <li>{t('changelog-v1.1.0-item3')}</li>
                <li>{t('changelog-v1.1.0-item4')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {t('changelog-v1.0.0-title')}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{t('changelog-v1.0.0-date')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('changelog-v1.0.0-item1')}</li>
                <li>{t('changelog-v1.0.0-item2')}</li>
                <li>{t('changelog-v1.0.0-item3')}</li>
                <li>{t('changelog-v1.0.0-item4')}</li>
                <li>{t('changelog-v1.0.0-item5')}</li>
                <li>{t('changelog-v1.0.0-item6')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">{t('changelog-v0.9.0-title')}</h3>
              <p className="text-sm text-muted-foreground mb-2">{t('changelog-v0.9.0-date')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('changelog-v0.9.0-item1')}</li>
                <li>{t('changelog-v0.9.0-item2')}</li>
                <li>{t('changelog-v0.9.0-item3')}</li>
                <li>{t('changelog-v0.9.0-item4')}</li>
                <li>{t('changelog-v0.9.0-item5')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">{t('changelog-v0.5.0-title')}</h3>
              <p className="text-sm text-muted-foreground mb-2">{t('changelog-v0.5.0-date')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('changelog-v0.5.0-item1')}</li>
                <li>{t('changelog-v0.5.0-item2')}</li>
                <li>{t('changelog-v0.5.0-item3')}</li>
                <li>{t('changelog-v0.5.0-item4')}</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
