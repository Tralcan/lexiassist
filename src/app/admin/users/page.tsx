import { createClient } from '@/lib/supabase/server';
import UserTableClient from './components/user-table-client';
import { Profile } from '@/types';

async function getUsers() {
    const supabase = createClient();
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return [];
    }

    const userIds = usersData.users.map(u => u.id);
    const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
    
    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
    }
    
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

    const usersWithProfiles = usersData.users.map(user => ({
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
