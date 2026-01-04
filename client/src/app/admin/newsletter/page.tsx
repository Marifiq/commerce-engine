'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/utils/api';
import { useToast } from '@/contexts';
import { Mail, Send, Trash2, Users, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NewsletterSubscriber {
  id: number;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedSubscribers, setSelectedSubscribers] = useState<number[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Debug: Log state changes in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Newsletter form state:', {
        subject: subject,
        subjectLength: subject.length,
        subjectTrimmed: subject.trim().length,
        markdownContent: markdownContent.substring(0, 50) + '...',
        markdownContentLength: markdownContent.length,
        markdownContentTrimmed: markdownContent.trim().length,
        isButtonDisabled: !subject.trim() || !markdownContent.trim(),
        sending: sending,
      });
    }
  }, [subject, markdownContent, sending]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/admin/newsletter/subscribers');
      setSubscribers(response.data.subscribers || []);
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
      showToast('Failed to load subscribers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!subject.trim() || !markdownContent.trim()) {
      showToast('Please fill in both subject and content', 'error');
      return;
    }

    try {
      setSending(true);
      const recipientIds = selectedSubscribers.length > 0 ? selectedSubscribers : undefined;
      
      await apiFetch('/admin/newsletter/send', {
        method: 'POST',
        body: {
          subject,
          message: markdownContent,
          recipientIds,
        },
      });

      showToast(
        `Newsletter sent to ${recipientIds ? recipientIds.length : subscribers.length} subscriber(s)`,
        'success'
      );
      setSubject('');
      setMarkdownContent('');
      setSelectedSubscribers([]);
    } catch (error) {
      console.error('Failed to send newsletter:', error);
      showToast('Failed to send newsletter', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSubscriber = async (id: number) => {
    if (!confirm('Are you sure you want to remove this subscriber?')) {
      return;
    }

    try {
      await apiFetch(`/admin/newsletter/subscribers/${id}`, {
        method: 'DELETE',
      });
      showToast('Subscriber removed', 'success');
      fetchSubscribers();
    } catch (error) {
      console.error('Failed to remove subscriber:', error);
      showToast('Failed to remove subscriber', 'error');
    }
  };

  const toggleSubscriberSelection = (id: number) => {
    setSelectedSubscribers((prev) =>
      prev.includes(id) ? prev.filter((subId) => subId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedSubscribers.length === subscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(subscribers.map((sub) => sub.id));
    }
  };

  const activeSubscribers = subscribers.filter((sub) => sub.isActive);

  return (
    <div className="p-6 lg:ml-72 min-h-screen bg-[#fafafa] dark:bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-black dark:text-white mb-2">Newsletter</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage subscribers and send newsletters with markdown support
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Newsletter Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Compose Newsletter */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-xl font-bold mb-6 text-black dark:text-white flex items-center gap-2">
                <Mail size={20} />
                Compose Newsletter
              </h2>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  placeholder="Newsletter subject"
                />
              </div>

              {/* Markdown Editor/Preview Toggle */}
              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    !previewMode
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Edit3 size={16} className="inline mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    previewMode
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Eye size={16} className="inline mr-2" />
                  Preview
                </button>
              </div>

              {/* Content Editor or Preview */}
              {previewMode ? (
                <div className="mb-4 min-h-[400px] p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 overflow-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {markdownContent || '*No content to preview*'}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                    Content (Markdown)
                  </label>
                  <textarea
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-mono text-sm min-h-[400px]"
                    placeholder="# Newsletter Title

Write your newsletter content here using **Markdown**:

- Use **bold** for emphasis
- Use *italic* for subtle emphasis
- Create lists with `-` or `*`
- Add links: [text](url)
- Add images: ![alt](url)

## Section Headers

You can use headers to organize your content.

### Subsection

> Blockquotes for important messages

\`\`\`code blocks\`\`\` for code snippets"
                  />
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Supports Markdown syntax including headers, lists, links, images, and code blocks
                  </p>
                </div>
              )}

              {/* Recipients Selection */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                  Recipients
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  >
                    {selectedSubscribers.length === subscribers.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    ({selectedSubscribers.length} selected)
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                  {selectedSubscribers.length === 0
                    ? `Will send to all ${subscribers.length} active subscribers`
                    : `Will send to ${selectedSubscribers.length} selected subscriber(s)`}
                </p>
              </div>

              {/* Send Button */}
              <div className="space-y-2">
                {(!subject.trim() || !markdownContent.trim()) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {!subject.trim() && !markdownContent.trim() 
                      ? 'Please enter a subject and content to enable sending'
                      : !subject.trim() 
                      ? 'Please enter a subject to enable sending'
                      : 'Please enter content to enable sending'}
                  </p>
                )}
                <button
                  onClick={handleSendNewsletter}
                  disabled={sending || !subject.trim() || !markdownContent.trim()}
                  className="w-full px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title={
                    sending 
                      ? 'Sending newsletter...' 
                      : !subject.trim() || !markdownContent.trim()
                      ? 'Please fill in both subject and content'
                      : 'Send newsletter to subscribers'
                  }
                >
                  <Send size={18} />
                  {sending ? 'Sending...' : 'Send Newsletter'}
                </button>
              </div>
            </div>
          </div>

          {/* Subscribers List */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                  <Users size={20} />
                  Subscribers
                </h2>
                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  {activeSubscribers.length} active
                </span>
              </div>

              {loading ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  Loading subscribers...
                </div>
              ) : subscribers.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  No subscribers yet
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {subscribers.map((subscriber) => (
                    <div
                      key={subscriber.id}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedSubscribers.includes(subscriber.id)
                          ? 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-800'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="checkbox"
                              checked={selectedSubscribers.includes(subscriber.id)}
                              onChange={() => toggleSubscriberSelection(subscriber.id)}
                              className="mt-1"
                            />
                            <p className="font-semibold text-sm text-black dark:text-white truncate">
                              {subscriber.name || 'No name'}
                            </p>
                            {!subscriber.isActive && (
                              <span className="text-xs px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate ml-6">
                            {subscriber.email}
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 ml-6">
                            {new Date(subscriber.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteSubscriber(subscriber.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-all"
                          title="Remove subscriber"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .prose {
          color: inherit;
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          color: inherit;
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .prose h1 {
          font-size: 2em;
        }
        .prose h2 {
          font-size: 1.5em;
        }
        .prose h3 {
          font-size: 1.25em;
        }
        .prose p {
          margin-bottom: 1em;
        }
        .prose ul,
        .prose ol {
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        .prose li {
          margin-bottom: 0.5em;
        }
        .prose a {
          color: inherit;
          text-decoration: underline;
        }
        .prose code {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-size: 0.9em;
        }
        .prose pre {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin-bottom: 1em;
        }
        .prose blockquote {
          border-left: 4px solid currentColor;
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
        }
        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
        }
        .dark .prose code {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .dark .prose pre {
          background-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

