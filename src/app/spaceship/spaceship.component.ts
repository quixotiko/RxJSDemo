import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { range, interval, fromEvent, combineLatest, merge } from 'rxjs';
import { map, toArray, mergeMap, startWith, scan, sampleTime, filter, timestamp, distinctUntilChanged, takeWhile } from 'rxjs/operators';
import { PainterService } from '../services/painter.service';

@Component({
  selector: 'app-spaceship',
  templateUrl: './spaceship.component.html',
  styleUrls: ['./spaceship.component.css']
})


export class SpaceshipComponent implements OnInit {

  @ViewChild('myCanvas', { static: true }) Canvas: ElementRef;
  ctx: any;
  myCanvas: HTMLCanvasElement;

  SPEED: number;
  STAR_NUMBER: number;
  // StarStream$: Observable<starInfo[]>;//注意是starInfo[]
  // SpaceShip$: Observable<spaceshipInfo>;

  HERO_Y: number;
  ENEMY_FREQ: number;
  ENEMY_SHOOTING_FREQ: number;

  constructor(private painterService: PainterService) {

    // this.SPEED = 40;
    // this.STAR_NUMBER = 250;
    // this.HERO_Y = this.myCanvas.height - 30;constructor里面可以进行属性初始化，但此时还没有获取到myCanvas
  }

  ngOnInit() {
    this.initCanvas();//必须将initCanvas放在initParams之前
    this.initParams();
    this.initGame();
  }

  initParams() {
    this.SPEED = 40;
    this.STAR_NUMBER = 250;
    this.HERO_Y = this.myCanvas.height - 60;
    this.ENEMY_FREQ = 1500;
    this.ENEMY_SHOOTING_FREQ = 2000;
  }

  initCanvas() {
    this.myCanvas = this.Canvas.nativeElement;
    this.ctx = this.myCanvas.getContext("2d");
    this.myCanvas.width = window.innerWidth;
    this.myCanvas.height = window.innerHeight;
  }

  isVisible(obj) {
    return obj.x > -40 && obj.x < this.myCanvas.width + 40 &&
      obj.y > -40 && obj.y < this.myCanvas.height + 40;
  }

  initGame() {
    const StarStream$ = range(1, this.STAR_NUMBER).pipe(
      map(() => {
        return {
          x: Math.random() * this.myCanvas.width,
          y: Math.random() * this.myCanvas.height,
          size: Math.random() * 3 + 1
        }
      }),
      toArray(),
      mergeMap((starArray) => interval(this.SPEED).pipe(map(() => {
        starArray.forEach((star) => {
          if (star.y >= this.myCanvas.height) {
            star.y = 0;
          }
          star.y += 3;
        });
        return starArray;
      }))
      ))

    const SpaceShip$ = fromEvent(this.myCanvas, 'mousemove').pipe(
      map((e) => {
        return {
          x: e.clientX,
          y: this.HERO_Y
        }
      }),
      startWith({
        x: this.myCanvas.width / 2,
        y: this.HERO_Y
      })
    )

    const Enemies$ = interval(this.ENEMY_FREQ).pipe(
      scan((enemyArray: any) => {
        let enemy = {
          x: Math.random() * this.myCanvas.width,
          y: -30,
          shots: [],
          isDead: false
        }
        interval(this.ENEMY_SHOOTING_FREQ).subscribe(() => {
          if(!enemy.isDead)
          {
            enemy.shots.push({
              x: enemy.x,
              y: enemy.y,
            });
          }
          enemy.shots = enemy.shots.filter((shot) => {
            return this.isVisible(shot);
          });
        })
        enemyArray.push(enemy);
        return enemyArray.filter((enemy) => {
          return this.isVisible(enemy);
        })
        .filter((enemy) => {
          return !(enemy.isDead && enemy.shots.length === 0)
          //只有当enemy的isDead为true并且射出去的子弹数量为零时才将enemy从enemies数组中移出，因为enemy死之后它的子弹不应该立即消失，此enemy也不应该立即从数组中删掉，因为在paintEnemies函数里我们是把enemy和它的子弹一起画出来的
        });
      }, [])
    )

    const playerFiring$ = merge(
      fromEvent(this.myCanvas, 'click'),
      fromEvent(this.myCanvas, 'keydown').pipe(filter((e) => { return e.keycode === 32; }))
    ).pipe(
      sampleTime(200),
      timestamp()
    )

    const HeroShot$ = combineLatest(
      playerFiring$,
      SpaceShip$,
      (shotEvents, spaceShip) => {
        return {
          timestamp: shotEvents.timestamp,
          x: spaceShip.x
        }
      }
    ).pipe(
      distinctUntilChanged((pre, cur) => { return pre.timestamp === cur.timestamp }),//这里修改了书上的错误
      scan((shotArray: any, shot: any) => {
        shotArray.push({ x: shot.x, y: this.HERO_Y });
        console.log(shotArray);
        return shotArray;
      }, []),
      startWith([{
        timestamp: 0,
        x: this.myCanvas.width / 2
      }])
    )

    const Game = combineLatest(
      StarStream$, SpaceShip$, Enemies$, HeroShot$,
      (stars, spaceship, enemies, heroShots) => {
        return {
          stars: stars,
          spaceship: spaceship,
          enemies: enemies,
          heroShots: heroShots
        };
      }
    ).pipe(
      sampleTime(this.SPEED),
      takeWhile((actors) => {
        return this.painterService.gameOver(actors.spaceship, actors.enemies) === false;
      })
    )

    Game.subscribe((actors) => {
      this.painterService.renderScene(actors, this.ctx, this.myCanvas);
    });
  }
}
