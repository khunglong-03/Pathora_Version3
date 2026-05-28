import { apiSlice } from "./apiSlice";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  TourGuideTask,
  CreateTourGuideTaskRequest,
  UpdateTourGuideTaskRequest,
  UpdateTourGuideTaskStatusRequest,
} from "@/types/tour-guide-tasks";

export const tourGuideApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getTourGuideTasks: builder.query<TourGuideTask[], string>({
      query: (tourInstanceId) => ({
        url: API_ENDPOINTS.TOUR_INSTANCE.GET_GUIDE_TASKS(tourInstanceId),
      }),
      transformResponse: (response: any) => {
        return response?.data || [];
      },
      providesTags: (result, error, tourInstanceId) => [
        { type: "TourGuideTasks", id: tourInstanceId },
        { type: "TourGuideTasks", id: "LIST" },
      ],
    }),

    createTourGuideTask: builder.mutation<string, CreateTourGuideTaskRequest>({
      query: (request) => ({
        url: API_ENDPOINTS.TOUR_INSTANCE.CREATE_GUIDE_TASK,
        method: "POST",
        body: request,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "TourGuideTasks", id: arg.tourInstanceId },
        { type: "TourGuideTasks", id: "LIST" },
      ],
    }),

    updateTourGuideTask: builder.mutation<
      void,
      { id: string; tourInstanceId: string; request: UpdateTourGuideTaskRequest }
    >({
      query: ({ id, request }) => ({
        url: API_ENDPOINTS.TOUR_INSTANCE.UPDATE_GUIDE_TASK(id),
        method: "PUT",
        body: request,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "TourGuideTasks", id: arg.tourInstanceId },
        { type: "TourGuideTasks", id: "LIST" },
      ],
    }),

    deleteTourGuideTask: builder.mutation<
      void,
      { id: string; tourInstanceId: string }
    >({
      query: ({ id }) => ({
        url: API_ENDPOINTS.TOUR_INSTANCE.DELETE_GUIDE_TASK(id),
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "TourGuideTasks", id: arg.tourInstanceId },
        { type: "TourGuideTasks", id: "LIST" },
      ],
    }),

    updateTourGuideTaskStatus: builder.mutation<
      void,
      { id: string; tourInstanceId: string; request: UpdateTourGuideTaskStatusRequest }
    >({
      query: ({ id, request }) => ({
        url: API_ENDPOINTS.TOUR_INSTANCE.UPDATE_GUIDE_TASK_STATUS(id),
        method: "PATCH",
        body: request,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "TourGuideTasks", id: arg.tourInstanceId },
        { type: "TourGuideTasks", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetTourGuideTasksQuery,
  useCreateTourGuideTaskMutation,
  useUpdateTourGuideTaskMutation,
  useDeleteTourGuideTaskMutation,
  useUpdateTourGuideTaskStatusMutation,
} = tourGuideApi;
