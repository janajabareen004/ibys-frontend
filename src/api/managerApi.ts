/**
 * Project Manager API facade.
 * Reads proxy through the REST client when USE_MOCK_API is off; writes always
 * flow through the in-memory mock store (backend hookup lands in Phase 2).
 */
import { USE_MOCK_API } from "./config";
import { apiClient } from "./apiClient";
import {
  mockManagerService,
  mockManagerBus,
  type ManagedProject,
  type ManagedStage,
  type ManagedTask,
  type ManagedRequest,
  type ManagedMeeting,
  type ManagedNotification,
  type Employee,
  type ActivityEvent,
  type ManagedPhoto,
  type ManagedDocument,
  type ManagedNote,
  type ManagedTenant,
} from "@/mocks/mockManagerService";

export type {
  ManagedProject,
  ManagedStage,
  ManagedTask,
  ManagedRequest,
  ManagedMeeting,
  ManagedNotification,
  Employee,
  ActivityEvent,
  ManagedPhoto,
  ManagedDocument,
  ManagedNote,
  ManagedTenant,
};

export { mockManagerBus };

export const managerApi = {
  getProjects: () =>
    USE_MOCK_API ? mockManagerService.getProjects() : apiClient.get<ManagedProject[]>("/manager/projects"),
  getProject: (id: string) =>
    USE_MOCK_API ? mockManagerService.getProject(id) : apiClient.get<ManagedProject | null>(`/manager/projects/${id}`),
  getStagesForProject: (projectId: string) =>
    USE_MOCK_API
      ? mockManagerService.getStagesForProject(projectId)
      : apiClient.get<ManagedStage[]>(`/manager/projects/${projectId}/stages`),
  getAllStages: () =>
    USE_MOCK_API ? mockManagerService.getAllStages() : apiClient.get<ManagedStage[]>(`/manager/stages`),
  getTasks: () =>
    USE_MOCK_API ? mockManagerService.getTasks() : apiClient.get<ManagedTask[]>("/manager/tasks"),
  getTask: (id: string) =>
    USE_MOCK_API ? mockManagerService.getTask(id) : apiClient.get<ManagedTask | null>(`/manager/tasks/${id}`),
  getRequests: () =>
    USE_MOCK_API ? mockManagerService.getRequests() : apiClient.get<ManagedRequest[]>("/manager/requests"),
  getMeetings: () =>
    USE_MOCK_API ? mockManagerService.getMeetings() : apiClient.get<ManagedMeeting[]>("/manager/meetings"),
  getNotifications: () =>
    USE_MOCK_API ? mockManagerService.getNotifications() : apiClient.get<ManagedNotification[]>("/manager/notifications"),
  getEmployees: () =>
    USE_MOCK_API ? mockManagerService.getEmployees() : apiClient.get<Employee[]>("/manager/team"),
  getEmployee: (id: string) =>
    USE_MOCK_API ? mockManagerService.getEmployee(id) : apiClient.get<Employee | null>(`/manager/team/${id}`),
  getActivity: () =>
    USE_MOCK_API ? mockManagerService.getActivity() : apiClient.get<ActivityEvent[]>("/manager/activity"),
  getPhotos: () =>
    USE_MOCK_API ? mockManagerService.getPhotos() : apiClient.get<ManagedPhoto[]>("/manager/photos"),
  getDocuments: () =>
    USE_MOCK_API ? mockManagerService.getDocuments() : apiClient.get<ManagedDocument[]>("/manager/documents"),
  getNotes: () =>
    USE_MOCK_API ? mockManagerService.getNotes() : apiClient.get<ManagedNote[]>("/manager/notes"),
  getTenants: () =>
    USE_MOCK_API ? mockManagerService.getTenants() : apiClient.get<ManagedTenant[]>("/manager/tenants"),
};

/**
 * Mutations. All mutate the in-memory mock store today; the shape mirrors
 * what a REST or edge-function endpoint would accept when the backend is
 * connected in Phase 2.
 */
export const managerMutations = {
  createTask: mockManagerService.createTask,
  updateTask: mockManagerService.updateTask,
  deleteTask: mockManagerService.deleteTask,
  addTaskComment: mockManagerService.addTaskComment,
  toggleSubtask: mockManagerService.toggleSubtask,
  updateStage: mockManagerService.updateStage,
  createMeeting: mockManagerService.createMeeting,
  updateMeeting: mockManagerService.updateMeeting,
  deleteMeeting: mockManagerService.deleteMeeting,
  updateRequest: mockManagerService.updateRequest,
  markNotificationRead: mockManagerService.markNotificationRead,
  markAllNotificationsRead: mockManagerService.markAllNotificationsRead,
  addPhoto: mockManagerService.addPhoto,
  deletePhoto: mockManagerService.deletePhoto,
  addDocument: mockManagerService.addDocument,
  deleteDocument: mockManagerService.deleteDocument,
  addNote: mockManagerService.addNote,
  deleteNote: mockManagerService.deleteNote,
};
