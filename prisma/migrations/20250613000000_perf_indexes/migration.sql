-- Performance indexes for planning, program feedbacks, and trainer session lookups

CREATE INDEX "sessions_training_id_status_idx" ON "sessions"("training_id", "status");

CREATE INDEX "sessions_trainer_id_start_datetime_idx" ON "sessions"("trainer_id", "start_datetime");

CREATE INDEX "feedbacks_training_id_created_at_idx" ON "feedbacks"("training_id", "created_at" DESC);

CREATE INDEX "session_trainers_user_id_idx" ON "session_trainers"("user_id");
