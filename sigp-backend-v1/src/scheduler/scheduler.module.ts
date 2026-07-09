import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// SchedulerModule — Centralise TOUS les crons du système (Blueprint V2)
// Les tâches métier (retention historique, RGPD, EVM auto, etc.)
// seront ajoutées ici progressivement dans les phases suivantes.
@Module({
  imports: [ScheduleModule.forRoot()],
})
export class SchedulerAppModule {}
