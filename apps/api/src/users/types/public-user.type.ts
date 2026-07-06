export interface PublicUser {
  id: string;
  name: string;
  email: string;
  cv_text: string | null;
  cv_filename: string | null;
  cv_uploaded_at: Date | null;
  created_at: Date;
}
