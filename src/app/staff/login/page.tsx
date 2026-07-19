import { Container } from "@/components/ui/container";
import { normalizeStaffNextPath } from "@/domain";
import { StaffLoginForm } from "@/features/staff/staff-login-form";

export const metadata = { title: "員工登入" };

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="staff-login-page">
      <Container><StaffLoginForm nextPath={normalizeStaffNextPath(next)} /></Container>
    </main>
  );
}
