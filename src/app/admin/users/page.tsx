
import { createAdminClient } from '@/lib/supabase/admin';
import UserTableClient from './components/user-table-client';

async function getUsers() {
    const supabase = createAdminClient();
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
    }

    const userIds = users.map(u => u.id);
    const { data: profilesData, error: profilesError } = await supabase
        .from('lex_profiles')
        .select('*')
        .in('id', userIds);
    
    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
    }
    
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

    const usersWithProfiles = users.map(user => ({
        ...user,
        profile: profilesMap.get(user.id) || null
    }));

    return usersWithProfiles;
}

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div>
            <UserTableClient users={users as any[]} />
        </div>
    );
}
