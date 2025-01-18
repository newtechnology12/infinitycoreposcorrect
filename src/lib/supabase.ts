import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kgxgolldaqsphdasxoxl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtneGdvbGxkYXFzcGhkYXN4b3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ0MTY1NzAsImV4cCI6MjAxOTk5MjU3MH0.ZmOhMI_lSNBNmiJavLPxQQY2on5QqCxGYcQA_p7MMyo"
);

export default supabase;
