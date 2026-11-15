grant select, update, delete on arise_site.quote_comments to authenticated;
create policy "Administrators can review quote comments"
on arise_site.quote_comments for select to authenticated
using ((select arise_site.is_admin()));
create policy "Administrators can approve held quote comments"
on arise_site.quote_comments for update to authenticated
using ((select arise_site.is_admin()))
with check ((select arise_site.is_admin()));
create policy "Administrators can remove quote comments"
on arise_site.quote_comments for delete to authenticated
using ((select arise_site.is_admin()));