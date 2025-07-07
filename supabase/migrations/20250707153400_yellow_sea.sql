/*
  # Create folders table for encrypted file storage

  1. New Tables
    - `folders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `folder_name` (text, not null)
      - `encrypted_content` (text, stores encrypted folder contents)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `folders` table
    - Add policy for users to access only their own folders
    - Users can perform all CRUD operations on their folders

  3. Important Notes
    - Encryption keys are generated client-side and never stored in database
    - Only encrypted content is stored in the database
    - Failed unlock attempts are tracked client-side for security
*/

-- Create the folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  folder_name text NOT NULL,
  encrypted_content text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access only their own folders
CREATE POLICY "Users can access own folders"
  ON folders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders(user_id);
CREATE INDEX IF NOT EXISTS folders_created_at_idx ON folders(created_at DESC);