import { Container, Graphics } from "pixi.js";

export class CatPropController {
  readonly container = new Container();
  private pencil: Graphics;
  private tip: Graphics;

  constructor() {
    this.pencil = new Graphics()
      .roundRect(-3, -18, 6, 24, 3)
      .fill(0xf1c16b)
      .stroke({ color: 0x5f3c16, width: 2 });
    this.tip = new Graphics()
      .moveTo(0, -26)
      .lineTo(5, -18)
      .lineTo(-5, -18)
      .closePath()
      .fill(0xf7e6c1)
      .stroke({ color: 0x5f3c16, width: 2 });

    this.pencil.visible = false;
    this.tip.visible = false;
    this.container.addChild(this.pencil, this.tip);
  }

  update(showWriting: boolean, elapsed: number, facing: number) {
    const active = showWriting;
    this.container.visible = active;

    if (!active) {
      return;
    }

    this.pencil.visible = true;
    this.tip.visible = true;
    this.container.scale.x = facing;
    this.container.position.set(22, 34 + Math.sin(elapsed * 11) * 2);
    this.container.rotation = 0.2 + Math.sin(elapsed * 10) * 0.06;
  }
}
