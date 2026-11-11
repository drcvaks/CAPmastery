import { ContentAdminWorkspace } from "../features/admin/components/ContentAdminWorkspace";
import { RequireRole } from "../features/auth/components/RequireRole";

export default function ContentReviewScreen() {
  return (
    <RequireRole area="content-review">
      <ContentAdminWorkspace mode="review" />
    </RequireRole>
  );
}
