'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MessageSquare, User } from 'lucide-react';
import { apiFetch } from '@/lib/utils/api';
import { useToast } from '@/contexts';
import { createSupportConversation } from '@/services/message.service';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import Image from 'next/image';

interface UserData {
  id: number;
  name: string;
  email: string;
  profileImage: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [messagingUserId, setMessagingUserId] = useState<number | null>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const res = await apiFetch(`/users/list?${params.toString()}`);
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageUser = async (userId: number) => {
    try {
      setMessagingUserId(userId);
      // Create conversation with the specific user
      const response = await createSupportConversation(`Chat with user`, userId);
      
      // Navigate to messages page
      router.push(`/messages?conversation=${response.conversation.id}`);
      showToast('Opening conversation...', 'success');
    } catch (error) {
      console.error('Failed to start conversation:', error);
      showToast('Failed to start conversation', 'error');
    } finally {
      setMessagingUserId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
            Users
          </h1>
          <p className="text-zinc-400">Connect with other users</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-zinc-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-16 w-16 rounded-full bg-zinc-800 mb-4"></div>
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : users.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-white transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {user.profileImage ? (
                      <div className="h-16 w-16 rounded-full overflow-hidden">
                        <Image
                          src={resolveImageUrl(user.profileImage)}
                          alt={user.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center">
                        <User className="w-8 h-8 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{user.name}</h3>
                      <p className="text-sm text-zinc-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMessageUser(user.id)}
                    disabled={messagingUserId === user.id}
                    className="w-full px-4 py-2.5 bg-white text-black rounded-lg hover:opacity-90 transition-all font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare size={16} />
                    {messagingUserId === user.id ? 'Starting...' : 'Message'}
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-zinc-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-400">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}

