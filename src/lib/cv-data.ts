
export type Experience = {
  title: string;
  company: string;
  period: string;
  description: string[];
};

export type SkillCategory = {
  name: string;
  skills: string[];
};

export type CVData = {
  name: string;
  email: string;
  role: string;
  summary: string;
  experiences: Experience[];
  skills: SkillCategory[];
  education: {
    school: string;
    degree: string;
    year: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    period: string;
    description: string;
  }[];
};

export const cvData: Record<string, CVData> = {
  en: {
    name: "Iwan Efendi",
    email: "iwan.efndi@gmail.com",
    role: "Procurement Specialist & IT Automation Enthusiast",
    summary: "A proactive professional with over 8 years of experience in telecommunications and administration. Specialized in simplifying administrative processes by integrating separate documents into centralized, automated Microsoft Excel systems. Proven track record in increasing work efficiency through formula optimization, data validation, and document standardization within PT Telkom Akses.",
    experiences: [
      {
        title: "Staff Procurement & Partnership",
        company: "PT Telkom Akses",
        period: "Jan 2018 - Present",
        description: [
          "Manage comprehensive administration for PT Telkom Akses working partners, including collection and verification of supporting documents.",
          "Execute procurement processes for goods/services in accordance with company procedures.",
          "Create and process SAP programs for transaction needs and work monitoring.",
          "Develop consolidated data reports using Microsoft Excel and Google Sheets for progress monitoring and reporting.",
          "Control and accelerate partner invoice payment processes through cross-divisional coordination.",
          "Ensure document completeness and timely administrative and payment processing."
        ]
      },
      {
        title: "NE Maintenance Technician",
        company: "Telkom Akses",
        period: "May 2017 - Jan 2018",
        description: [
          "Responsible for maintenance and monitoring of Telkom equipment conditions in Jambi City.",
          "Conduct routine checks on equipment cleanliness to maintain performance and operational reliability.",
          "Perform voltage checks on each device to ensure system stability and security.",
          "Identify potential technical disruptions early and perform preventive actions to minimize downtime.",
          "Prepare inspection reports and coordinate follow-up repairs if necessary."
        ]
      },
      {
        title: "HSE Staff",
        company: "Telkom Akses",
        period: "Nov 2016 - May 2017",
        description: [
          "Ensure IndiHome technicians understand and apply work safety procedures (K3) in the field.",
          "Provide training on the use of safety belts according to standards when working at heights.",
          "Direct technicians regarding safe pole climbing techniques and operational procedures.",
          "Train technicians on the correct use and lowering of sliding ladders to minimize workplace accidents.",
          "Increase awareness of potential electrical hazards on poles and the surrounding work environment."
        ]
      },
      {
        title: "Capdev Staff (Capital Development)",
        company: "Telkom Akses",
        period: "Jun 2016 - Nov 2016",
        description: [
          "Ensure Jambi's Telkom Akses workforce understands work standards and operating procedures.",
          "Provide technical briefing and direct practice related to installation and fiber optic cable splicing (FTTH).",
          "Conduct LAN network installation training at customer homes according to quality and safety standards.",
          "Evaluate technical understanding and skills of the workforce to maintain installation quality."
        ]
      },
      {
        title: "PT1 Technician (IndiHome New Installation)",
        company: "Telkom Akses",
        period: "Aug 2015 - Jun 2016",
        description: [
          "Expertise in fiber optic cable pulling and installation for IndiHome internet services.",
          "Experienced in the FTTH network installation process from cable pulling to customer service activation.",
          "Understand installation standards, signal quality (attenuation), and field safety procedures."
        ]
      },
      {
        title: "Computer & Laptop Technician",
        company: "Computer Shop",
        period: "Oct 2013 - Sep 2014",
        description: [
          "Install and configure Windows operating systems on computers and laptops.",
          "Troubleshoot hardware and software issues for computers, laptops, and printers.",
          "Diagnose problems systematically to ensure effective and efficient solutions.",
          "Provide customer support and consultation for IT device needs."
        ]
      }
    ],
    skills: [
      {
        name: "Automation & Data",
        skills: ["Microsoft Excel (Advanced)", "Google Sheets", "SAP System", "Data Integration"]
      },
      {
        name: "IT & Web",
        skills: ["Website Creation (NextJS/React)", "Software Installation", "Hardware Troubleshooting", "LAN Networking"]
      },
      {
        name: "Telecom & Field",
        skills: ["Fiber Optic (FTTH)", "Maintenance", "HSE (Safety) Standards"]
      }
    ],
    education: [
      {
        school: "SMKN1 Jambi",
        degree: "Higher Secondary / 'A' Level",
        year: "2013"
      }
    ],
    certifications: [
      {
        name: "SIM C License",
        issuer: "Korlantas Polri",
        period: "Active",
        description: "Valid driver's license supporting field mobility for installation, inspection, and network monitoring."
      }
    ]
  },
  id: {
    name: "Iwan Efendi",
    email: "iwan.efndi@gmail.com",
    role: "Spesialis Pengadaan & Antusias Otomasi IT",
    summary: "Profesional proaktif dengan pengalaman lebih dari 8 tahun di bidang telekomunikasi dan administrasi. Ahli dalam menyederhanakan proses administrasi dengan mengintegrasikan berbagai dokumen terpisah menjadi sistem Microsoft Excel yang terpusat dan otomatis. Memiliki rekam jejak terbukti dalam meningkatkan efisiensi kerja melalui optimalisasi formula, validasi data, dan standarisasi dokumen di PT Telkom Akses.",
    experiences: [
      {
        title: "Staff Procurement & Partnership",
        company: "PT Telkom Akses",
        period: "Jan 2018 - Sekarang",
        description: [
          "Mengelola administrasi Mitra Kerja PT Telkom Akses secara menyeluruh, termasuk verifikasi dokumen pendukung.",
          "Melaksanakan proses pengadaan barang/jasa sesuai prosedur perusahaan.",
          "Memproses program SAP untuk kebutuhan transaksi dan monitoring pekerjaan.",
          "Mengembangkan rekapitulasi data menggunakan Excel dan Google Sheets untuk monitoring progres dan pelaporan.",
          "Melakukan kontrol dan percepatan proses pembayaran tagihan mitra melalui koordinasi lintas divisi.",
          "Memastikan kelengkapan dokumen serta ketepatan waktu proses administrasi dan pembayaran."
        ]
      },
      {
        title: "Teknisi Maintenance NE",
        company: "Telkom Akses",
        period: "Mei 2017 - Jan 2018",
        description: [
          "Bertanggung jawab atas pemeliharaan dan monitoring kondisi perangkat Telkom di wilayah Kota Jambi.",
          "Melakukan pengecekan rutin terhadap kebersihan perangkat untuk menjaga performa operasional.",
          "Melakukan pemeriksaan tegangan listrik pada perangkat untuk memastikan stabilitas sistem.",
          "Mengidentifikasi potensi gangguan teknis sejak dini dan melakukan tindakan preventif."
        ]
      },
      {
        title: "Staff HSE",
        company: "Telkom Akses",
        period: "Nov 2016 - Mei 2017",
        description: [
          "Memastikan teknisi IndiHome menerapkan prosedur keselamatan kerja (K3) di lapangan.",
          "Memberikan pembekalan penggunaan safety belt sesuai standar saat bekerja di ketinggian.",
          "Mengarahkan teknisi mengenai teknik memanjat tiang yang aman.",
          "Melatih penggunaan tangga sorong yang benar untuk meminimalkan risiko kecelakaan."
        ]
      },
      {
        title: "Staff Capdev (Capital Development)",
        company: "Telkom Akses",
        period: "Jun 2016 - Nov 2016",
        description: [
          "Memastikan tenaga kerja Telkom Akses Jambi memahami standar kerja dan prosedur operasional.",
          "Memberikan pembekalan teknis terkait pemasangan dan penyambungan kabel fiber optik (FTTH).",
          "Melakukan pelatihan instalasi jaringan LAN di rumah pelanggan sesuai standar kualitas.",
          "Mengevaluasi pemahaman teknis tenaga kerja untuk menjaga kualitas instalasi."
        ]
      },
      {
        title: "Teknisi PT1 (Pasang Baru IndiHome)",
        company: "Telkom Akses",
        period: "Agt 2015 - Jun 2016",
        description: [
          "Keahlian dalam penarikan dan instalasi kabel fiber optik layanan internet IndiHome.",
          "Berpengalaman dalam proses instalasi FTTH dari penarikan kabel hingga aktivasi layanan.",
          "Memahami standar instalasi, kualitas sinyal (redaman), dan prosedur keselamatan kerja."
        ]
      },
      {
        title: "Teknisi Komputer & Laptop",
        company: "Computer Shop",
        period: "Okt 2013 - Sep 2014",
        description: [
          "Instalasi dan konfigurasi sistem operasi Windows pada komputer dan laptop.",
          "Troubleshooting hardware dan software untuk PC, laptop, dan printer.",
          "Melakukan diagnosa permasalahan secara sistematis untuk solusi yang efisien.",
          "Melayani pelanggan dalam konsultasi kebutuhan perangkat IT."
        ]
      }
    ],
    skills: [
      {
        name: "Otomasi & Data",
        skills: ["Microsoft Excel (Lanjut)", "Google Sheets", "Sistem SAP", "Integrasi Data"]
      },
      {
        name: "IT & Web",
        skills: ["Pembuatan Website (NextJS/React)", "Instalasi Software", "Troubleshooting Hardware", "Jaringan LAN"]
      },
      {
        name: "Telekomunikasi",
        skills: ["Fiber Optic (FTTH)", "Pemeliharaan Perangkat", "Standar K3 (HSE)"]
      }
    ],
    education: [
      {
        school: "SMKN1 Jambi",
        degree: "Sekolah Menengah Kejuruan",
        year: "2013"
      }
    ],
    certifications: [
      {
        name: "SIM C",
        issuer: "Korlantas Polri",
        period: "Aktif",
        description: "Mendukung mobilitas kerja lapangan untuk instalasi, inspeksi, dan monitoring jaringan."
      }
    ]
  }
};
