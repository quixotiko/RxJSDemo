import { Injectable } from '@angular/core';
import { starInfo } from '../spaceship/common.types';
import { Subject, Observable } from 'rxjs';
import { scan, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PainterService {


  SHOOTING_SPEED: number = 10;
  SCORE_INCREASE: number = 10;
  ScoreSubject$: Subject<number> = new Subject<number>();
  score: number;

  constructor() {
    this.ScoreSubject$.pipe(
      scan((acc, cur) => {
        return acc + cur;
      }, 0),
      startWith(0)
    ).subscribe((score) => {
      this.score = score;
    });

  }
  paintStars(stars: starInfo[], ctx, myCanvas) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, myCanvas.width, myCanvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach((star) => {
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  }

  drawTriangle(x, y, width, color, direction, ctx) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - width, y);
    ctx.lineTo(x, direction === 'up' ? y - width : y + width);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x - width, y);
    ctx.fill();
  }

  paintSpaceShip(x, y, ctx) {
    this.drawTriangle(x, y, 20, '#ff0000', 'up', ctx);
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  paintEnemies(enemies, ctx) {
    enemies.forEach((enemy) => {
      enemy.y += 3;
      enemy.x += this.getRandomInt(-2, 2);
      if (!enemy.isDead) {
        this.drawTriangle(enemy.x, enemy.y, 20, '#00ff00', 'down', ctx);
      }

      enemy.shots.forEach((shot) => {
        shot.y += this.SHOOTING_SPEED;
        this.drawTriangle(shot.x, shot.y, 5, '#00ffff', 'down', ctx);
      })
    });
  }

  collision(target1, target2) {
    return (target1.x > target2.x - 20 && target1.x < target2.x + 20) &&
      (target1.y > target2.y - 20 && target1.y < target2.y + 20);
  }

  paintHeroShots(heroShots, enemies, ctx) {
    heroShots.forEach((shot, i) => {
      for (var l = 0; l < enemies.length; l++) {
        var enemy = enemies[l];
        if (!enemy.isDead && this.collision(shot, enemy)) {

          this.ScoreSubject$.next(this.SCORE_INCREASE);//计分
          enemy.isDead = true;
          shot.x = shot.y -= 1000;//书里给的值是100，太小了会有bug
          break;
        }
      }
      shot.y -= this.SHOOTING_SPEED;
      this.drawTriangle(shot.x, shot.y, 5, '#ffff00', 'up', ctx);
    });
  }
  // paintEnemies(enemies,ctx) {
  //   enemies.forEach(function (enemy) {
  //     enemy.y += 5;
  //     enemy.x += this.getRandomInt(-15, 15);
  //     this.drawTriangle(enemy.x, enemy.y, 20, '#00ff00', 'down',ctx);
  //   });
  // }
  // 这里会报错，因为箭头函数和普通的function里面的this指向不同
  // 箭头函数的 this 永远指向其上下文的 this，普通函数的this指向调用它的那个对象

  paintScore(score,ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Score: ' + score, 40, 43);
  }
  renderScene(actors, ctx, myCanvas) {
    this.paintStars(actors.stars, ctx, myCanvas);
    this.paintSpaceShip(actors.spaceship.x, actors.spaceship.y, ctx);
    this.paintEnemies(actors.enemies, ctx);
    this.paintHeroShots(actors.heroShots, actors.enemies, ctx);
    this.paintScore(this.score,ctx);
  }

  gameOver(ship, enemies) {
    return enemies.some((enemy) => {
      if (this.collision(ship, enemy)) {
        return true
      }
      return enemy.shots.some((shot) => {
        return this.collision(ship, shot);
      })
    })
  }
}
