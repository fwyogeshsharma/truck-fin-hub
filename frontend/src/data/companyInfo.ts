export interface CompanyInfo {
  name: string;
  logo: string;
  rating: number;
  marketCap?: string;
  headquarters?: string;
  founded?: string;
  employees?: string;
  industry: string;
  description: string;
  financials?: {
    revenue?: string;
    profit?: string;
    debtToEquity?: string;
  };
  trustFactors?: string[];
}

export const companyDatabase: Record<string, CompanyInfo> = {
  "Varun Beverages": {
    name: "Varun Beverages Limited",
    logo: "/clients/Varun-Beverages.png",
    rating: 4.5,
    marketCap: "₹1,23,000 Cr",
    headquarters: "Gurugram, Haryana",
    founded: "1995",
    employees: "8,000+",
    industry: "Food & Beverages",
    description: "Largest franchisee of PepsiCo in India, operating across 7 countries with a strong distribution network.",
    financials: {
      revenue: "₹15,000 Cr",
      profit: "₹1,200 Cr",
      debtToEquity: "0.35"
    },
    trustFactors: [
      "NSE Listed (VBL)",
      "PepsiCo Franchisee",
      "International Operations",
      "Consistent Growth Track Record"
    ]
  },
  "Emami": {
    name: "Emami Limited",
    logo: "/clients/emami.png",
    rating: 4.3,
    marketCap: "₹18,500 Cr",
    headquarters: "Kolkata, West Bengal",
    founded: "1974",
    employees: "2,500+",
    industry: "FMCG - Personal Care",
    description: "Leading Indian FMCG company known for brands like Boroplus, Fair & Handsome, and Navratna.",
    financials: {
      revenue: "₹3,200 Cr",
      profit: "₹520 Cr",
      debtToEquity: "0.12"
    },
    trustFactors: [
      "BSE/NSE Listed",
      "50+ Years in Business",
      "Strong Brand Portfolio",
      "Debt-Free Operations"
    ]
  },
  "Greenply": {
    name: "Greenply Industries Limited",
    logo: "/clients/greenply.png",
    rating: 4.2,
    marketCap: "₹4,800 Cr",
    headquarters: "Delhi",
    founded: "1990",
    employees: "1,200+",
    industry: "Building Materials",
    description: "India's largest interior infrastructure brand, specializing in plywood, veneers, and MDF boards.",
    financials: {
      revenue: "₹2,100 Cr",
      profit: "₹180 Cr",
      debtToEquity: "0.45"
    },
    trustFactors: [
      "NSE Listed (GREENPLY)",
      "Market Leader in Plywood",
      "Pan-India Distribution",
      "Eco-Friendly Products"
    ]
  },
  "Berger Paints": {
    name: "Berger Paints India Limited",
    logo: "/clients/berger.png",
    rating: 4.6,
    marketCap: "₹65,000 Cr",
    headquarters: "Kolkata, West Bengal",
    founded: "1923",
    employees: "3,500+",
    industry: "Paints & Coatings",
    description: "Second largest paint company in India with a 100-year legacy and innovative product portfolio.",
    financials: {
      revenue: "₹8,500 Cr",
      profit: "₹950 Cr",
      debtToEquity: "0.08"
    },
    trustFactors: [
      "BSE/NSE Listed",
      "100+ Years Legacy",
      "Strong R&D Capabilities",
      "Premium Brand Positioning"
    ]
  },
  "Oswal Cables": {
    name: "RR Kabel (Oswal Cables)",
    logo: "/clients/oswal-cables.png",
    rating: 4.1,
    marketCap: "₹2,500 Cr (Est.)",
    headquarters: "Silvassa",
    founded: "1990",
    industry: "Electrical Cables",
    description: "Leading manufacturer of electrical wires and cables with a strong distribution network across India.",
    financials: {
      revenue: "₹4,200 Cr",
      profit: "₹320 Cr"
    },
    trustFactors: [
      "ISO Certified",
      "Export to 50+ Countries",
      "State-of-the-Art Manufacturing",
      "Strong Brand Recognition"
    ]
  },
  "Dynamic Cables": {
    name: "Dynamic Cables Limited",
    logo: "/clients/dynamic-cables.png",
    rating: 3.9,
    marketCap: "₹850 Cr",
    headquarters: "Mumbai, Maharashtra",
    founded: "1980",
    industry: "Electrical Cables",
    description: "Established manufacturer of power and control cables serving industrial and infrastructure sectors.",
    financials: {
      revenue: "₹650 Cr",
      profit: "₹45 Cr"
    },
    trustFactors: [
      "40+ Years Experience",
      "Government Projects Track Record",
      "Quality Certifications",
      "Pan-India Presence"
    ]
  },
  "Raydean": {
    name: "Raydean Industries",
    logo: "/clients/raydean.png",
    rating: 4.0,
    industry: "Manufacturing",
    description: "Diversified manufacturing company with focus on quality products and customer satisfaction.",
    trustFactors: [
      "Quality Focused",
      "Customer-Centric Approach",
      "Industry Experience",
      "Reliable Operations"
    ]
  },
  "RCC Industries": {
    name: "RCC Industries Private Limited",
    logo: "/clients/rcc.png",
    rating: 3.8,
    industry: "Industrial Products",
    description: "Manufacturing company specializing in industrial components and solutions.",
    trustFactors: [
      "Established Player",
      "Industrial Expertise",
      "Quality Standards",
      "B2B Focus"
    ]
  },
  "Rex Pipes": {
    name: "Rex Pipes & Cables",
    logo: "/clients/rex-pipes.png",
    rating: 4.1,
    marketCap: "₹1,200 Cr (Est.)",
    headquarters: "Gujarat",
    industry: "Pipes & Cables",
    description: "Leading manufacturer of PVC pipes, electrical conduits, and cable management solutions.",
    financials: {
      revenue: "₹850 Cr"
    },
    trustFactors: [
      "ISO 9001 Certified",
      "Export Quality Products",
      "Modern Manufacturing Units",
      "Wide Product Range"
    ]
  },
  "RL Industries": {
    name: "RL Industries Limited",
    logo: "/clients/rl-industries.png",
    rating: 3.9,
    industry: "Manufacturing",
    description: "Industrial manufacturing company with diverse product portfolio and strong market presence.",
    trustFactors: [
      "Industry Experience",
      "Quality Products",
      "Reliable Supplier",
      "Growing Market Share"
    ]
  },
  "Sagar Industries": {
    name: "Sagar Industries",
    logo: "/clients/sagar.png",
    rating: 3.7,
    industry: "Industrial Products",
    description: "Manufacturing and trading company serving various industrial sectors.",
    trustFactors: [
      "Established Operations",
      "Industry Network",
      "Customer Base",
      "Quality Focus"
    ]
  },
  "Source One": {
    name: "Source One",
    logo: "/clients/source-one.png",
    rating: 4.0,
    industry: "Distribution & Trading",
    description: "Trading and distribution company with efficient supply chain management.",
    trustFactors: [
      "Distribution Network",
      "Timely Delivery",
      "Client Relationships",
      "Market Knowledge"
    ]
  },
  "Star Rising": {
    name: "Star Rising Industries",
    logo: "/clients/star-rising.png",
    rating: 3.8,
    industry: "Manufacturing",
    description: "Emerging manufacturing company with focus on innovation and quality.",
    trustFactors: [
      "Growth Trajectory",
      "Quality Standards",
      "Innovation Focus",
      "Competitive Pricing"
    ]
  },
  "True Power": {
    name: "True Power India",
    logo: "/clients/true-power.png",
    rating: 4.2,
    industry: "Electrical Equipment",
    description: "Power solutions provider specializing in electrical equipment and energy solutions.",
    trustFactors: [
      "Technical Expertise",
      "Energy Solutions",
      "Project Experience",
      "Industry Certifications"
    ]
  },
  "Mangal Electricals": {
    name: "Mangal Electricals",
    logo: "/clients/mangal-electricals.png",
    rating: 3.9,
    industry: "Electrical Products",
    description: "Electrical products manufacturer and supplier with regional presence.",
    trustFactors: [
      "Regional Presence",
      "Product Range",
      "Customer Service",
      "Competitive Rates"
    ]
  },
  "Manishankar Oils": {
    name: "Manishankar Oils & Foods",
    logo: "/clients/Manishankar-Oils.png",
    rating: 4.0,
    industry: "FMCG - Oils",
    description: "Edible oil manufacturer with focus on quality and health-conscious products.",
    trustFactors: [
      "Food Safety Standards",
      "Quality Oils",
      "Regional Brand",
      "Health Focus"
    ]
  },
  "Man Structures": {
    name: "Man Structures",
    logo: "/clients/man-structures.png",
    rating: 3.8,
    industry: "Construction",
    description: "Structural engineering and construction company serving infrastructure projects.",
    trustFactors: [
      "Engineering Expertise",
      "Project Portfolio",
      "Safety Standards",
      "Timely Execution"
    ]
  },
  "Mohit Polytech": {
    name: "Mohit Polytech Private Limited",
    logo: "/clients/Mohit-Polytech-Pvt-Ltd.png",
    rating: 3.9,
    industry: "Plastics & Polymers",
    description: "Manufacturer of plastic and polymer products for industrial applications.",
    trustFactors: [
      "Manufacturing Capability",
      "Product Quality",
      "Industrial Experience",
      "Customization Options"
    ]
  },
  "Bhandari Plastic": {
    name: "Bhandari Plastic Industries",
    logo: "/clients/bhandari-plastic.png",
    rating: 3.7,
    industry: "Plastics",
    description: "Plastic products manufacturer serving various industrial and commercial sectors.",
    trustFactors: [
      "Industry Experience",
      "Product Range",
      "Quality Control",
      "Market Presence"
    ]
  },
  "Balaji Industries": {
    name: "Balaji Industries",
    logo: "/clients/balaji.png",
    rating: 3.8,
    industry: "Manufacturing",
    description: "Manufacturing company with diverse product offerings and growing market presence.",
    trustFactors: [
      "Diversified Portfolio",
      "Quality Focus",
      "Customer Base",
      "Operational Efficiency"
    ]
  },
  "Alisha Torrent": {
    name: "Alisha Torrent Industries",
    logo: "/clients/AlishaTorrent.svg",
    rating: 3.6,
    industry: "Industrial Products",
    description: "Industrial products manufacturer with focus on quality and customer satisfaction.",
    trustFactors: [
      "Manufacturing Units",
      "Quality Products",
      "Customer Focus",
      "Market Network"
    ]
  },
  "INA Energy": {
    name: "INA Energy Solutions",
    logo: "/clients/ina-energy.png",
    rating: 4.1,
    industry: "Energy Solutions",
    description: "Energy solutions provider specializing in renewable and conventional power systems.",
    trustFactors: [
      "Energy Expertise",
      "Project Experience",
      "Technical Capabilities",
      "Sustainable Solutions"
    ]
  }
};

// Helper function to get company info by name or logo path
export const getCompanyInfo = (nameOrLogo: string): CompanyInfo | null => {
  // Try direct name match first
  if (companyDatabase[nameOrLogo]) {
    return companyDatabase[nameOrLogo];
  }

  // Try to match by logo path
  const matchedEntry = Object.entries(companyDatabase).find(([_, info]) =>
    info.logo === nameOrLogo || info.logo.includes(nameOrLogo) || nameOrLogo.includes(info.name)
  );

  return matchedEntry ? matchedEntry[1] : null;
};
