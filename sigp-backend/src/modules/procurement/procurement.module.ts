import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({ 
  imports: [ProjectsModule],
  controllers: [ProcurementController], 
  providers: [ProcurementService] 
})
export class ProcurementModule {}
