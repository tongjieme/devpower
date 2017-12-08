declare var require: (module: string) => any;
interface iShape {
    name: string;
    width: number;
    height: number;
    color?: string;
}
declare class Shape {
    area: number;
    color: string;
    constructor(name: string, width: number, height: number);
    shoutout(): string;
}
declare var square: Shape;
declare class Shape3D extends Shape {
    name: string;
    volume: number;
    constructor(name: string, width: number, height: number, length: number);
    shoutout(): string;
    superShout(): string;
}
declare var cube: Shape3D;
