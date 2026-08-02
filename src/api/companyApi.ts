/**
 * Building Company API facade.
 * Uses the mock service when VITE_USE_MOCK_API is true; otherwise proxies to REST endpoints.
 */
import { USE_MOCK_API } from "./config";
import { apiClient } from "./apiClient";
import {
  mockCompanyService,
  mockCompanyBus,
  type CompanyProject,
  type CompanyProjectStatus,
  type CompanyStage,
  type PhotoAsset,
  type DocumentAsset,
  type UploadItem,
  type CompanyRequest,
  type CompanyMeeting,
  type CompanyNotification,
  type CompanyActivity,
  type CompanyEmployee,
  type CompanyComment,
  type ProjectManagerPerson,
  type CompanyTenant,
  type Apartment,
  type ApartmentStatus,
} from "@/mocks/mockCompanyService";

export type {
  CompanyProject,
  CompanyProjectStatus,
  CompanyStage,
  PhotoAsset,
  DocumentAsset,
  UploadItem,
  CompanyRequest,
  CompanyMeeting,
  CompanyNotification,
  CompanyActivity,
  CompanyEmployee,
  CompanyComment,
  ProjectManagerPerson,
  CompanyTenant,
  Apartment,
  ApartmentStatus,
};


export { mockCompanyBus };

export const companyApi = {
  getProjects: () =>
    USE_MOCK_API ? mockCompanyService.getProjects() : apiClient.get<CompanyProject[]>("/company/projects"),
  getProject: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getProject(id) : apiClient.get<CompanyProject | null>(`/company/projects/${id}`),
  getStages: () =>
    USE_MOCK_API ? mockCompanyService.getStages() : apiClient.get<CompanyStage[]>("/company/stages"),
  getStage: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getStage(id) : apiClient.get<CompanyStage | null>(`/company/stages/${id}`),
  getStagesForProject: (projectId: string) =>
    USE_MOCK_API
      ? mockCompanyService.getStagesForProject(projectId)
      : apiClient.get<CompanyStage[]>(`/company/projects/${projectId}/stages`),
  getPhotos: () =>
    USE_MOCK_API ? mockCompanyService.getPhotos() : apiClient.get<PhotoAsset[]>("/company/photos"),
  getDocuments: () =>
    USE_MOCK_API ? mockCompanyService.getDocuments() : apiClient.get<DocumentAsset[]>("/company/documents"),
  getUploads: () =>
    USE_MOCK_API ? mockCompanyService.getUploads() : apiClient.get<UploadItem[]>("/company/uploads"),
  getRequests: () =>
    USE_MOCK_API ? mockCompanyService.getRequests() : apiClient.get<CompanyRequest[]>("/company/requests"),
  getMeetings: () =>
    USE_MOCK_API ? mockCompanyService.getMeetings() : apiClient.get<CompanyMeeting[]>("/company/meetings"),
  getNotifications: () =>
    USE_MOCK_API ? mockCompanyService.getNotifications() : apiClient.get<CompanyNotification[]>("/company/notifications"),
  getActivity: () =>
    USE_MOCK_API ? mockCompanyService.getActivity() : apiClient.get<CompanyActivity[]>("/company/activity"),
  getEmployees: () =>
    USE_MOCK_API ? mockCompanyService.getEmployees() : apiClient.get<CompanyEmployee[]>("/company/team"),
  getEmployee: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getEmployee(id) : apiClient.get<CompanyEmployee | null>(`/company/team/${id}`),
  getComments: () =>
    USE_MOCK_API ? mockCompanyService.getComments() : apiClient.get<CompanyComment[]>("/company/comments"),

  // ---- project managers
  getProjectManagers: () =>
    USE_MOCK_API ? mockCompanyService.getProjectManagers() : apiClient.get<ProjectManagerPerson[]>("/company/project-managers"),

  // ---- tenants
  getTenants: () =>
    USE_MOCK_API ? mockCompanyService.getTenants() : apiClient.get<CompanyTenant[]>("/company/tenants"),
  getTenant: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getTenant(id) : apiClient.get<CompanyTenant | null>(`/company/tenants/${id}`),

  // ---- apartments
  getApartments: () =>
    USE_MOCK_API ? mockCompanyService.getApartments() : apiClient.get<Apartment[]>("/company/apartments"),
  getApartmentsForProject: (projectId: string) =>
    USE_MOCK_API
      ? mockCompanyService.getApartmentsForProject(projectId)
      : apiClient.get<Apartment[]>(`/company/projects/${projectId}/apartments`),
};

/**
 * Mutations — call the mock store synchronously when mock mode is on,
 * otherwise proxy to REST. Every mutation triggers the pub/sub bus so
 * `useCompanyData` hooks refetch automatically.
 */
export const companyMutations = {
  // projects
  createProject: (input: Parameters<typeof mockCompanyService.createProject>[0]) =>
    USE_MOCK_API ? mockCompanyService.createProject(input) : apiClient.post<CompanyProject>("/company/projects", input),
  updateProject: (id: string, patch: Partial<CompanyProject>) =>
    USE_MOCK_API ? mockCompanyService.updateProject(id, patch) : apiClient.patch<CompanyProject>(`/company/projects/${id}`, patch),
  deleteProject: (id: string) =>
    USE_MOCK_API ? mockCompanyService.deleteProject(id) : apiClient.delete<void>(`/company/projects/${id}`),
  assignProjectManager: (projectId: string, managerId: string) =>
    USE_MOCK_API
      ? mockCompanyService.assignProjectManager(projectId, managerId)
      : apiClient.post<CompanyProject>(`/company/projects/${projectId}/assign-manager`, { managerId }),

  // project managers
  createProjectManager: (input: Parameters<typeof mockCompanyService.createProjectManager>[0]) =>
    USE_MOCK_API ? mockCompanyService.createProjectManager(input) : apiClient.post<ProjectManagerPerson>("/company/project-managers", input),
  updateProjectManager: (id: string, patch: Partial<ProjectManagerPerson>) =>
    USE_MOCK_API ? mockCompanyService.updateProjectManager(id, patch) : apiClient.patch<ProjectManagerPerson>(`/company/project-managers/${id}`, patch),
  deleteProjectManager: (id: string) =>
    USE_MOCK_API ? mockCompanyService.deleteProjectManager(id) : apiClient.delete<void>(`/company/project-managers/${id}`),

  // tenants
  createTenant: (input: Parameters<typeof mockCompanyService.createTenant>[0]) =>
    USE_MOCK_API ? mockCompanyService.createTenant(input) : apiClient.post<CompanyTenant>("/company/tenants", input),
  updateTenant: (id: string, patch: Partial<CompanyTenant>) =>
    USE_MOCK_API ? mockCompanyService.updateTenant(id, patch) : apiClient.patch<CompanyTenant>(`/company/tenants/${id}`, patch),
  deleteTenant: (id: string) =>
    USE_MOCK_API ? mockCompanyService.deleteTenant(id) : apiClient.delete<void>(`/company/tenants/${id}`),

  // apartments
  createApartment: (input: Parameters<typeof mockCompanyService.createApartment>[0]) =>
    USE_MOCK_API ? mockCompanyService.createApartment(input) : apiClient.post<Apartment>("/company/apartments", input),
  updateApartment: (id: string, patch: Partial<Apartment>) =>
    USE_MOCK_API ? mockCompanyService.updateApartment(id, patch) : apiClient.patch<Apartment>(`/company/apartments/${id}`, patch),
  deleteApartment: (id: string) =>
    USE_MOCK_API ? mockCompanyService.deleteApartment(id) : apiClient.delete<void>(`/company/apartments/${id}`),
  assignTenantToApartment: (apartmentId: string, tenantId: string | null) =>
    USE_MOCK_API
      ? mockCompanyService.assignTenantToApartment(apartmentId, tenantId)
      : apiClient.post<Apartment>(`/company/apartments/${apartmentId}/assign`, { tenantId }),

  // stages
  updateStage: (id: string, patch: Partial<CompanyStage>) =>
    USE_MOCK_API ? mockCompanyService.updateStage(id, patch) : apiClient.patch<CompanyStage>(`/company/stages/${id}`, patch),
  addStageComment: (input: Parameters<typeof mockCompanyService.addStageComment>[0]) =>
    USE_MOCK_API ? mockCompanyService.addStageComment(input) : apiClient.post<CompanyComment>(`/company/stages/comments`, input),

  // meetings
  createMeeting: (input: Parameters<typeof mockCompanyService.createMeeting>[0]) =>
    USE_MOCK_API ? mockCompanyService.createMeeting(input) : apiClient.post<CompanyMeeting>("/company/meetings", input),
  updateMeeting: (id: string, patch: Partial<CompanyMeeting>) =>
    USE_MOCK_API ? mockCompanyService.updateMeeting(id, patch) : apiClient.patch<CompanyMeeting>(`/company/meetings/${id}`, patch),
  setMeetingStatus: (id: string, status: CompanyMeeting["status"]) =>
    USE_MOCK_API ? mockCompanyService.setMeetingStatus(id, status) : apiClient.post<CompanyMeeting>(`/company/meetings/${id}/status`, { status }),
  deleteMeeting: (id: string) =>
    USE_MOCK_API ? mockCompanyService.deleteMeeting(id) : apiClient.delete<void>(`/company/meetings/${id}`),

  // requests
  setRequestStatus: (id: string, status: CompanyRequest["status"]) =>
    USE_MOCK_API ? mockCompanyService.setRequestStatus(id, status) : apiClient.post<CompanyRequest>(`/company/requests/${id}/status`, { status }),
  replyToRequest: (id: string, message: string) =>
    USE_MOCK_API ? mockCompanyService.replyToRequest(id, message) : apiClient.post<CompanyRequest>(`/company/requests/${id}/reply`, { message }),
};
