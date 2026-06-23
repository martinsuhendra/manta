-- CreateIndex
CREATE INDEX "class_sessions_brandId_date_status_idx" ON "class_sessions"("brandId", "date", "status");

-- CreateIndex
CREATE INDEX "class_sessions_brandId_date_visibility_status_idx" ON "class_sessions"("brandId", "date", "visibility", "status");

-- CreateIndex
CREATE INDEX "class_sessions_teacher_id_date_status_idx" ON "class_sessions"("teacher_id", "date", "status");

-- CreateIndex
CREATE INDEX "bookings_class_session_id_status_idx" ON "bookings"("class_session_id", "status");

-- CreateIndex
CREATE INDEX "bookings_user_id_createdAt_idx" ON "bookings"("user_id", "createdAt");

-- CreateIndex
CREATE INDEX "users_role_createdAt_idx" ON "users"("role", "createdAt");
