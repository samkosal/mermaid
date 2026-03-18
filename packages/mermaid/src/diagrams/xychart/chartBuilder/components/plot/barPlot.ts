import type {
  BarPlotData,
  BoundingRect,
  DrawableElem,
  PlotData,
  XYChartConfig,
} from '../../interfaces.js';
import type { Axis } from '../axis/index.js';

export class BarPlot {
  constructor(
    private barData: BarPlotData,
    private boundingRect: BoundingRect,
    private xAxis: Axis,
    private yAxis: Axis,
    private orientation: XYChartConfig['chartOrientation'],
    private plotIndex: number,
    private barSeriesIndex: number,
    private barSeriesCount: number,
    private allPlots: PlotData[]
  ) {}

  getDrawableElement(): DrawableElem[] {
    const barPaddingPercent = 0.05;

    const totalGroupWidth =
      Math.min(this.xAxis.getAxisOuterPadding() * 2, this.xAxis.getTickDistance()) *
      (1 - barPaddingPercent);

    const barSeriesCount = Math.max(this.barSeriesCount, 1);
    const barWidth = totalGroupWidth / barSeriesCount;
    const groupStartOffset = totalGroupWidth / 2;

    const isStacked = !!this.barData.stacked;

    const axisBaseline =
      this.orientation === 'vertical'
        ? this.boundingRect.y + this.boundingRect.height
        : this.boundingRect.x;

    const rectData = this.barData.data.map((d, categoryIndex) => {
      const categoryValue = d[0];
      const currentValue = d[1];

      const scaledCategory = this.xAxis.getScaleValue(categoryValue);

      let stackedBaseValue = 0;

      if (isStacked) {
        for (let i = 0; i < this.plotIndex; i++) {
          const prevPlot = this.allPlots[i];
          if (prevPlot.type === 'bar' && prevPlot.stacked) {
            stackedBaseValue += prevPlot.data[categoryIndex][1];
          }
        }
      }

      const scaledTop = this.yAxis.getScaleValue(stackedBaseValue + currentValue);
      const scaledBase = this.yAxis.getScaleValue(stackedBaseValue);

      if (this.orientation === 'horizontal') {
        const xStart = Math.min(isStacked ? scaledBase : axisBaseline, scaledTop);
        const width = Math.abs((isStacked ? scaledBase : axisBaseline) - scaledTop);

        return {
          x: xStart,
          y: isStacked
            ? scaledCategory - totalGroupWidth / 2
            : scaledCategory - groupStartOffset + this.barSeriesIndex * barWidth,
          height: isStacked ? totalGroupWidth : barWidth,
          width,
          fill: this.barData.fill,
          strokeWidth: 0,
          strokeFill: this.barData.fill,
        };
      }

      const rectBottom = isStacked ? scaledBase : axisBaseline;
      const rectTop = scaledTop;

      return {
        x: isStacked
          ? scaledCategory - totalGroupWidth / 2
          : scaledCategory - groupStartOffset + this.barSeriesIndex * barWidth,
        y: Math.min(rectTop, rectBottom),
        width: isStacked ? totalGroupWidth : barWidth,
        height: Math.abs(rectBottom - rectTop),
        fill: this.barData.fill,
        strokeWidth: 0,
        strokeFill: this.barData.fill,
      };
    });

    return [
      {
        groupTexts: ['plot', `bar-plot-${this.plotIndex}`],
        type: 'rect',
        data: rectData,
      },
    ];
  }
}
