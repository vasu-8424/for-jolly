import { redirect } from 'next/navigation';

export default function Home() {
  // The middleware handles checking if the user is authenticated.
  // We simply redirect the root path to the dashboard.
  redirect('/dashboard');
}
