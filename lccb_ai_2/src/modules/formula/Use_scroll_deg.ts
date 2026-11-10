import UseScroll  from "./Use_scroll";

export default function UseScroll__Deg() {
    const scrollY = Number(UseScroll());

    const maxScroll = 3000;   // how far down until max rotation
    const maxDeg = 360;       // maximum rotation in degrees

    // clamp between 0 and maxDeg
    const deg = Math.min(maxDeg, (scrollY / maxScroll) * maxDeg);

    return deg;
}