import type { useI18n } from "./I18nProvider";

type T = ReturnType<typeof useI18n>["t"];

/**
 * Localize company project display fields. Falls back to the raw value from
 * the mock data when a translation key is not defined.
 */
export function translateCompanyProject<
  P extends {
    id: string;
    name: string;
    address: string;
    clientName: string;
    projectManager: string;
    description?: string;
  },
>(t: T, project: P) {
  const tr = (field: string, fallback: string) => {
    const key = `company.projectData.${project.id}.${field}`;
    const v = t(key);
    return v === key ? fallback : v;
  };
  return {
    ...project,
    name: tr("name", project.name),
    address: tr("address", project.address),
    clientName: tr("clientName", project.clientName),
    projectManager: tr("projectManager", project.projectManager),
    description: project.description ? tr("description", project.description) : project.description,
  };
}
