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

export type PositioningStat = {
  label: string;
  value: string;
};

export type AboutProfile = {
  badge: string;
  panelLabel: string;
  statement: string;
  companyLabel: string;
  locationLabel: string;
  experienceIntro: string;
  founderLabel: string;
  brandLabel: string;
  storyCardDescription: string;
  workflowCardDescription: string;
  philosophyCardDescription: string;
  resumeDescription: string;
  stats: PositioningStat[];
};

export type CVData = {
  name: string;
  email: string;
  role: string;
  summary: string;
  profile: AboutProfile;
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
    role: "Procurement Specialist, Technical Writer & Workflow Builder",
    summary:
      "I build SnipGeek as a practical, story-driven space for clear documentation, useful writing, and technology that solves real problems. My background spans telecommunications, administration, procurement, and IT troubleshooting, which shapes how I approach both digital workflows and editorial work. I am especially interested in turning messy, repetitive processes into systems that are simpler, more structured, and easier to trust.",
    profile: {
      badge: "Founder Story",
      panelLabel: "Positioning",
      statement:
        "I build SnipGeek as a place for technical documentation that feels clearer, more honest, and more useful for real-world users.",
      companyLabel: "PT Telkom Akses",
      locationLabel: "Indonesia",
      experienceIntro:
        "Selected roles that shaped how I work today: from field operations, safety, and troubleshooting to cleaner administrative systems and practical workflows.",
      founderLabel: "Founder",
      brandLabel: "SnipGeek",
      storyCardDescription:
        "SnipGeek was built from a practical need: preserve useful technical knowledge and make it easier to revisit over time.",
      workflowCardDescription:
        "My workflow is simple: use the right tool for the job, without forcing one system to solve every task.",
      philosophyCardDescription:
        "I prefer writing that is clear, honest, and genuinely useful over content that only looks polished on the surface.",
      resumeDescription:
        "For a more formal and concise professional reference, you can download my full resume below.",
      stats: [
        { label: "Focus", value: "Practical Tech" },
        { label: "Direction", value: "Clarity First" },
        { label: "Interest", value: "Automation" },
        { label: "Style", value: "Useful Writing" },
      ],
    },
    experiences: [
      {
        title: "Staff Procurement & Partnership",
        company: "PT Telkom Akses",
        period: "Jan 2018 - Present",
        description: [
          "Manage partner administration and procurement workflows with strong attention to accuracy, completeness, and procedural compliance.",
          "Build reporting structures in Microsoft Excel, Google Sheets, and SAP to improve visibility, monitoring, and day-to-day coordination.",
          "Support faster invoice and payment processing through cross-divisional follow-up and document control.",
          "Help turn operational work into clearer, more traceable systems that reduce friction for everyone involved.",
        ],
      },
      {
        title: "NE Maintenance Technician",
        company: "Telkom Akses",
        period: "May 2017 - Jan 2018",
        description: [
          "Handled maintenance and monitoring of network equipment to keep operational reliability stable in the field.",
          "Performed routine inspections, voltage checks, and preventive actions to reduce the risk of disruption and downtime.",
          "Built practical technical discipline through direct exposure to infrastructure, troubleshooting, and follow-up coordination.",
        ],
      },
      {
        title: "HSE Staff",
        company: "Telkom Akses",
        period: "Nov 2016 - May 2017",
        description: [
          "Focused on field safety readiness by helping technicians understand and apply K3 procedures in real working conditions.",
          "Delivered practical guidance on working at height, ladder handling, pole climbing, and electrical hazard awareness.",
          "Strengthened my approach to systems thinking by learning that good work depends on clarity, discipline, and risk awareness.",
        ],
      },
      {
        title: "Capdev Staff (Capital Development)",
        company: "Telkom Akses",
        period: "Jun 2016 - Nov 2016",
        description: [
          "Supported workforce readiness through technical briefing, direct practice, and quality-focused field training.",
          "Helped standardize installation understanding across FTTH and LAN work so execution stayed consistent and safe.",
          "Built early experience in translating technical standards into practical guidance people could actually apply.",
        ],
      },
      {
        title: "PT1 Technician (IndiHome New Installation)",
        company: "Telkom Akses",
        period: "Aug 2015 - Jun 2016",
        description: [
          "Worked directly on FTTH installation from cable pulling to service activation for new IndiHome customers.",
          "Developed hands-on understanding of installation standards, attenuation, and field execution quality.",
          "This role became part of the technical foundation behind how I write about practical technology today.",
        ],
      },
      {
        title: "Computer & Laptop Technician",
        company: "Computer Shop",
        period: "Oct 2013 - Sep 2014",
        description: [
          "Installed, configured, and repaired computers, laptops, and printers for everyday user needs.",
          "Diagnosed hardware and software problems systematically to provide practical and efficient solutions.",
          "This early work shaped my long-term interest in troubleshooting, useful documentation, and real-world IT support.",
        ],
      },
    ],
    skills: [
      {
        name: "Workflow & Automation",
        skills: [
          "Microsoft Excel (Advanced)",
          "Google Sheets",
          "SAP System",
          "Data Structuring",
        ],
      },
      {
        name: "Technical Writing & Web",
        skills: [
          "Technical Documentation",
          "NextJS / React",
          "Process-Oriented Writing",
          "Knowledge Organization",
        ],
      },
      {
        name: "Systems & Troubleshooting",
        skills: [
          "Hardware Troubleshooting",
          "Software Installation",
          "LAN Networking",
          "Operational Problem Solving",
        ],
      },
    ],
    education: [
      {
        school: "SMKN1 Jambi",
        degree: "Higher Secondary / 'A' Level",
        year: "2013",
      },
    ],
    certifications: [
      {
        name: "SIM C License",
        issuer: "Korlantas Polri",
        period: "Active",
        description:
          "Valid driver's license supporting field mobility for installation, inspection, and network monitoring.",
      },
    ],
  },
  id: {
    name: "Iwan Efendi",
    email: "iwan.efndi@gmail.com",
    role: "Spesialis Pengadaan, Penulis Teknis & Perancang Workflow",
    summary:
      "Saya membangun SnipGeek sebagai ruang yang praktis dan berorientasi cerita untuk dokumentasi yang jelas, tulisan yang berguna, dan teknologi yang benar-benar menyelesaikan masalah nyata. Latar belakang saya berada di persimpangan telekomunikasi, administrasi, pengadaan, dan troubleshooting IT, dan itu membentuk cara saya membangun alur kerja digital sekaligus menulis. Saya sangat tertarik mengubah proses yang berantakan dan berulang menjadi sistem yang lebih sederhana, lebih rapi, dan lebih bisa diandalkan.",
    profile: {
      badge: "Cerita Founder",
      panelLabel: "Posisi & Arah",
      statement:
        "Saya membangun SnipGeek sebagai ruang untuk dokumentasi teknis yang lebih jujur, lebih rapi, dan lebih berguna bagi pengguna nyata.",
      companyLabel: "PT Telkom Akses",
      locationLabel: "Indonesia",
      experienceIntro:
        "Sorotan peran utama yang membentuk cara saya bekerja: mulai dari pekerjaan lapangan, keselamatan, troubleshooting, hingga sistem administrasi dan workflow yang lebih rapi.",
      founderLabel: "Founder",
      brandLabel: "SnipGeek",
      storyCardDescription:
        "SnipGeek dibangun dari kebutuhan nyata: menyimpan pengetahuan teknis yang benar-benar membantu dan tetap berguna seiring waktu.",
      workflowCardDescription:
        "Pendekatan saya sederhana: gunakan alat yang tepat untuk pekerjaan yang tepat, tanpa memaksakan satu sistem untuk semua kebutuhan.",
      philosophyCardDescription:
        "Saya lebih memilih tulisan yang jelas, jujur, dan bisa dipakai daripada konten yang sekadar terlihat rapi di permukaan.",
      resumeDescription:
        "Untuk referensi profesional yang lebih ringkas dan formal, Anda bisa mengunduh resume lengkap saya di bawah ini.",
      stats: [
        { label: "Fokus", value: "Teknologi Praktis" },
        { label: "Arah", value: "Kejelasan Utama" },
        { label: "Minat", value: "Otomasi" },
        { label: "Gaya", value: "Tulisan Berguna" },
      ],
    },
    experiences: [
      {
        title: "Staff Procurement & Partnership",
        company: "PT Telkom Akses",
        period: "Jan 2018 - Sekarang",
        description: [
          "Mengelola administrasi mitra kerja dan alur pengadaan dengan perhatian tinggi pada akurasi, kelengkapan, dan kepatuhan prosedural.",
          "Membangun struktur pelaporan di Microsoft Excel, Google Sheets, dan SAP agar monitoring pekerjaan lebih jelas dan mudah ditelusuri.",
          "Membantu mempercepat proses tagihan dan pembayaran melalui kontrol dokumen serta koordinasi lintas divisi.",
          "Turut mengubah pekerjaan operasional menjadi sistem yang lebih rapi, lebih terukur, dan lebih minim gesekan.",
        ],
      },
      {
        title: "Teknisi Maintenance NE",
        company: "Telkom Akses",
        period: "Mei 2017 - Jan 2018",
        description: [
          "Menangani pemeliharaan dan monitoring perangkat jaringan untuk menjaga keandalan operasional di lapangan.",
          "Melakukan inspeksi rutin, pengecekan tegangan, dan tindakan preventif untuk menekan risiko gangguan dan downtime.",
          "Membangun kedisiplinan teknis melalui pengalaman langsung pada infrastruktur, troubleshooting, dan koordinasi tindak lanjut.",
        ],
      },
      {
        title: "Staff HSE",
        company: "Telkom Akses",
        period: "Nov 2016 - Mei 2017",
        description: [
          "Berfokus pada kesiapan keselamatan lapangan dengan membantu teknisi memahami dan menerapkan prosedur K3 dalam kondisi kerja nyata.",
          "Memberikan arahan praktis tentang kerja di ketinggian, penggunaan tangga, teknik memanjat tiang, dan kewaspadaan terhadap bahaya listrik.",
          "Memperkuat pendekatan saya terhadap sistem kerja melalui pemahaman bahwa pekerjaan yang baik bergantung pada kejelasan, disiplin, dan kesadaran risiko.",
        ],
      },
      {
        title: "Staff Capdev (Capital Development)",
        company: "Telkom Akses",
        period: "Jun 2016 - Nov 2016",
        description: [
          "Mendukung kesiapan tenaga kerja melalui pembekalan teknis, praktik langsung, dan pelatihan lapangan yang berorientasi kualitas.",
          "Membantu menyamakan pemahaman instalasi FTTH dan LAN agar eksekusi di lapangan tetap konsisten dan aman.",
          "Membangun pengalaman awal dalam menerjemahkan standar teknis menjadi panduan praktis yang benar-benar bisa diterapkan.",
        ],
      },
      {
        title: "Teknisi PT1 (Pasang Baru IndiHome)",
        company: "Telkom Akses",
        period: "Agt 2015 - Jun 2016",
        description: [
          "Bekerja langsung pada instalasi FTTH dari penarikan kabel hingga aktivasi layanan pelanggan IndiHome.",
          "Mengembangkan pemahaman praktis tentang standar instalasi, redaman sinyal, dan kualitas eksekusi lapangan.",
          "Peran ini menjadi bagian dari fondasi teknis yang membentuk cara saya menulis tentang teknologi praktis saat ini.",
        ],
      },
      {
        title: "Teknisi Komputer & Laptop",
        company: "Computer Shop",
        period: "Okt 2013 - Sep 2014",
        description: [
          "Melakukan instalasi, konfigurasi, dan perbaikan komputer, laptop, serta printer untuk kebutuhan pengguna sehari-hari.",
          "Mendiagnosis masalah hardware dan software secara sistematis untuk menghasilkan solusi yang praktis dan efisien.",
          "Pengalaman awal ini membentuk minat jangka panjang saya pada troubleshooting, dokumentasi yang berguna, dan dukungan IT dunia nyata.",
        ],
      },
    ],
    skills: [
      {
        name: "Workflow & Otomasi",
        skills: [
          "Microsoft Excel (Lanjut)",
          "Google Sheets",
          "Sistem SAP",
          "Struktur Data Kerja",
        ],
      },
      {
        name: "Penulisan Teknis & Web",
        skills: [
          "Dokumentasi Teknis",
          "NextJS / React",
          "Penulisan Berorientasi Proses",
          "Pengorganisasian Pengetahuan",
        ],
      },
      {
        name: "Sistem & Troubleshooting",
        skills: [
          "Troubleshooting Hardware",
          "Instalasi Software",
          "Jaringan LAN",
          "Pemecahan Masalah Operasional",
        ],
      },
    ],
    education: [
      {
        school: "SMKN1 Jambi",
        degree: "Sekolah Menengah Kejuruan",
        year: "2013",
      },
    ],
    certifications: [
      {
        name: "SIM C",
        issuer: "Korlantas Polri",
        period: "Aktif",
        description:
          "Mendukung mobilitas kerja lapangan untuk instalasi, inspeksi, dan monitoring jaringan.",
      },
    ],
  },
};
