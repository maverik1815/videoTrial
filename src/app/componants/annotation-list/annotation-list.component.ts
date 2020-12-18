import { Annotation, TrialVideo } from './../../core/models/annotations.model';
import { SharedService } from './../../service/shared.service';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Store } from '@ngrx/store';
import {
  VideoTrialStoreActions,
  VideoTrialStoreSelectors,
  VideoTrialStoreState,
} from 'src/app/root-store/video-trial-store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-annotation-list',
  templateUrl: './annotation-list.component.html',
  styleUrls: ['./annotation-list.component.scss'],
})
export class AnnotationListComponent implements OnInit {
  @ViewChild('comment', { static: true }) commentBox!: ElementRef;
  @Input()
  videoId!: string;

  @Output()
  jumpToLocation: EventEmitter<string> = new EventEmitter(true);

  currentTime = '0';
  comments = '';
  showSaveOption = false;
  annotationList!: Observable<Annotation[]>;

  columnList = ['Time', 'Description', 'Action'];

  constructor(
    private sharedService: SharedService,
    private store$: Store<VideoTrialStoreState.State>
  ) {}

  ngOnInit(): void {
    this.annotationList = this.store$
      .select(VideoTrialStoreSelectors.getVideoList)
      .pipe(
        map((videoList: TrialVideo[]) => {
          for (const iterator of videoList) {
            if (iterator.video.videoId === this.videoId) {
              return iterator.annotations;
            } else {
              return [];
            }
          }
          return [];
        })
      );
  }

  addAnnotation(): void {
    this.showSaveOption = true;
    this.currentTime = this.sharedService.currentTimeObs$.value.time;
    const relativeValue = this.sharedService.currentTimeObs$.value.videoPlayerTime;

    this.sharedService.pauseVideoObs$.next(true);
    const element = this.commentBox.nativeElement as HTMLInputElement;
    element.focus();
  }

  // getProgressValue(time: string): number {
  //   const percentage = (parseInt(time, 10) / parseInt(this.duration)) * 100;
  //   return Math.floor(percentage);
  // }
  cancle(): void {
    this.currentTime = '';
    this.comments = '';
    this.showSaveOption = false;
  }

  save(): void {
    this.showSaveOption = false;

    const userResponse: Annotation = {
      id: 'annotationId-' + Math.random() * 100,
      time: this.currentTime,
      comments: this.comments,
      videoPlayerTime: this.sharedService.currentTimeObs$.value.videoPlayerTime,
    };

    this.store$.dispatch(
      VideoTrialStoreActions.addAnnotations({
        annotationsList: [userResponse],
        videoId: this.videoId,
      })
    );
    this.currentTime = '';
    this.comments = '';
  }

  deleteAnnotation(id: string): void {
    this.store$.dispatch(
      VideoTrialStoreActions.deleteAnnotation({
        videoId: this.videoId,
        id,
      })
    );
  }

  jumpToAnnotaion(annotation: Annotation): void {
    // this.jumpToLocation.emit(annotation.videoPlayerTime);
    this.sharedService.jumpToAnnotaion.next(annotation.videoPlayerTime);
  }
}