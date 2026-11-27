CREATE TABLE course_progress (
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  cleared INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, course_id)
);
