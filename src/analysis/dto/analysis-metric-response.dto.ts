import { ApiProperty } from '@nestjs/swagger';
import { AnalysisMetric } from '../../common/entities/analysis-metric.entity';

export class AnalysisMetricResponseDto {
  @ApiProperty({ description: 'Unique identifier of the metric' })
  id: string;

  @ApiProperty({ enum: ['tone', 'clarity', 'energy', 'sentiment', 'pause', 'speed'], 
    description: 'Type of the metric' })
  metricType: string;

  @ApiProperty({ description: 'Numeric value of the metric' })
  value: number;

  @ApiProperty({ required: false, description: 'Optional label for the metric' })
  label?: string;

  @ApiProperty({ description: 'Timestamp when the metric was recorded' })
  timestamp: number;

  @ApiProperty({ description: 'Timestamp when the metric was created' })
  createdAt: Date;

  constructor(metric: AnalysisMetric) {
    this.id = metric.id;
    this.metricType = metric.metricType;
    this.value = metric.value;
    this.label = metric.label;
    this.timestamp = metric.timestamp;
    this.createdAt = metric.createdAt;
  }
}
