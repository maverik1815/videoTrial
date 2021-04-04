import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const selectVideoState = createFeatureSelector<State>('videoTrial');

export const getVideoList = createSelector(selectVideoState, (state: State) => {
  console.log(state);
  return state.video;
});

export const getCurrentVideo = createSelector(
  selectVideoState,
  (state: State) => {
    return state.currentVideo;
  }
);

export const getProcedure = createSelector(selectVideoState, (state: State) => {
  return state.procedure;
});

export const isLoading = createSelector(
  selectVideoState,
  (state: State) => state.isLoading
);

export const isLoadingProcedures = createSelector(
  selectVideoState,
  (state: State) => state.isLoadingProcedures
);

export const getProcedures = createSelector(
  selectVideoState,
  (state: State) => state.procedures
);

export const unscrubbedVideo = createSelector(
  selectVideoState,
  (state: State) => state.unscrubbedVideo
);

export const getCurrentVideoTab = createSelector(
  selectVideoState,
  (state: State) => state.currentTabIndex
);

export const getUploadingFile = createSelector(
  selectVideoState,
  (state: State) => [...state.fileUpload]
);

export const getUploadingFileByName = createSelector(
  selectVideoState,
  (state: State, props: { fileName: string }) =>
    state.fileUpload.find((ele) => ele.fileName === props.fileName)
);

export const getStudyList = createSelector(selectVideoState, (state: State) =>
  state.studyList
    .filter((ele) =>
      ele.site.findIndex((iter) => iter.role === 'Admin') > -1 ? true : false
    )
    .map((res) => res.name)
);

export const getSiteList = createSelector(selectVideoState, (state: State) => {
  const a = state.studyList
    .filter((e) => e.name === state.currentStudy)
    .map((iter) => iter.site)
    .map((ele) =>
      ele.filter(
        (e) => e.role === 'Admin' && e.siteRequestStatus === 'approved'
      )
    );
  return a[0];
});

export const getAllUsers = createSelector(
  selectVideoState,
  (state: State) => state.users
);
export const getAllRoles = createSelector(
  selectVideoState,
  (state: State) => state.roles
);
export const getFilteredUser = createSelector(
  selectVideoState,
  (state: State) => state.users
);


export const getUserDetails = createSelector(
  selectVideoState,
  (state: State) => state.currentUser
)
