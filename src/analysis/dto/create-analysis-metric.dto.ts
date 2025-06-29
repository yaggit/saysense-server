import { ApiProperty } from '@nestjs/swagger';
import { MetricType } from '../../common/entities/analysis-metric.entity';

export class CreateAnalysisMetricDto {
  @ApiProperty({
    description: 'Type of the metric',
    enum: MetricType,
    example: MetricType.TONE,
  })
  metricType: MetricType;

  @ApiProperty({
    description: 'Numeric value of the metric',
    example: 0.85,
  })
  value: number;

  @ApiProperty({
    description: 'Optional label for the metric',
    required: false,
    example: 'positive',
  })
  label?: string;

  @ApiProperty({
    description: 'Timestamp in seconds when this metric was recorded',
    example: 123.45,
  })
  timestamp: number;
}
