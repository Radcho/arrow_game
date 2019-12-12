type ImageSource = string | HTMLImageElement | { file: string } | { data: string };
declare type SpriteBehavior = (sprite: Sprite, x?: number, y?: number) => void;

declare class Sprite {
    public left: number;
    public right: number;
    public top: number;
    public bottom: number;
    public width: number;
    public height: number;
    public image: Image;
    public images: Array<Image>;

    constructor(activity: Activity, appearance: ImageSource, x: number, y: number, behavior?: SpriteBehavior);

    loadImage(source: ImageSource): void;
    erase(): void;
    saveState(): string;
    loadState(state: string): void;
    isIn(x: number, y: number): boolean;
    isOverRect(x: number, y: number, width: number, height: number): boolean;
    findOverlapped(sprites?: Array<Sprite>): Sprite | null;
    contains(sprite: Sprite): boolean;
    bringToFront(behind?: Sprite): void;
    getFinalX(): number;
    getFinalY(): number;
    setXY(x: number, y: number): void;
    move(): number;
    paint(context: CanvasRenderingContext2D): void;
    test(mouseX: number, mouseY: number): boolean;
    setHome(homeX?: number, homeY?: number): void;
    placeAt(target: Sprite): void;
    placeInto(target: Sprite): void;
}

declare class Activity {
    public animating: boolean;
    public enabled: boolean;
    public onClick: (sprite: Sprite) => void;
    public onDragTake: (dragging: Sprite) => void;
    public onDragMove: (dragging: Sprite) => void;
    public onDragDrop: (dragging: Sprite) => void;
    public onPaintBackground: (context: CanvasRenderingContext2D) => void;
    public onPaintForeground: (context: CanvasRenderingContext2D) => void;
    public onAnimation: () => void;

    constructor(canvas: HTMLCanvasElement | string, enabled: boolean);

    saveInitialState(): void;
    setup(activity: Activity): void;
    saveState(): string;
    loadState(state: string): void;
    // click, drag & drop:
    performStart(x: number, y: number): boolean;
    performMove(x: number, y: number): void;
    // mouse events:
    mouseDown(event: MouseEvent): void;
    mouseMove(event: MouseEvent): void;
    mouseUp(): void;
    // touch events:
    touchStart(event: TouchEvent): void;
    touchMove(event: TouchEvent): void;
    touchEndCancel(event: TouchEvent): void;
    // animation & painting:
    move(): boolean | undefined;
    paint(): void;
    animate(): void;
}

// Sprite behavior:
declare function performEnd(): void;
declare function clickSprite(sprite: Sprite): void;
declare function dragSprite(sprite: Sprite, x: number, y: number): void;
declare function clickDragSprite(sprite: Sprite, x: number, y: number): void;

// window events:
declare function windowLoad(): void;
declare function windowResize(): void;

declare var activities: Array<Activity>;
declare var windowLoaded: boolean;
declare var clicking: boolean;
declare var dragging: boolean;
declare var lastX: number;
declare var lastY: number;
declare var touchFirstId: number;
declare var isAnimateRequest: boolean;
