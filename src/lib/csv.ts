import Papa from "papaparse";
import { Lead } from "@/types";

export interface ParseCsvResult {
  leads: Lead[];
  skippedCount: number;
}

export const parseLeadsFromCsv = (file: File): Promise<ParseCsvResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedLeads: Lead[] = [];
        const data = results.data as Record<string, string | null | undefined>[];
        let skippedCount = 0;

        console.log("Parsed CSV data:", data);

        data.forEach((row) => {
          // Heuristic to find columns
          const emailKey = Object.keys(row).find(k => k.toLowerCase().includes("email"));
          const nameKey = Object.keys(row).find(k => k.toLowerCase().includes("name") && !k.toLowerCase().includes("company"));
          const companyKey = Object.keys(row).find(k => k.toLowerCase().includes("company") || k.toLowerCase().includes("organization"));

          // Helper to safely get string value
          const getValue = (key: string | undefined) => key ? row[key] : undefined;

          const email = getValue(emailKey);
          const name = getValue(nameKey);
          const company = getValue(companyKey);

          if (email && name && company) {
            parsedLeads.push({
              name: name,
              email: email,
              company: company,
            });
          } else {
            skippedCount++;
          }
        });

        resolve({ leads: parsedLeads, skippedCount });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
