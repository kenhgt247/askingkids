import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateBlogArticle } from '../services/geminiService';
import { BlogPost, BlogComment } from '../types';
import { User as UserIcon, Sparkles, PenTool, Image as ImageIcon, Send, ArrowLeft, Calendar, Search, Heart, MessageSquare } from 'lucide-react';

interface BlogProps {
  initialPostId?: string | null;
}

export const ParentingBlog: React.FC<BlogProps> = ({ initialPostId }) => {
  const { user, addNotification, updateUserPoints } = useApp();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Comment Form State
  const [commentInput, setCommentInput] = useState('');
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  // Writing Form State
  const [writeTitle, setWriteTitle] = useState('');
  const [writeCategory, setWriteCategory] = useState('Góc Chia Sẻ');
  const [writeContent, setWriteContent] = useState('');

  const [posts, setPosts] = useState<BlogPost[]>([
    {
      id: '1',
      title: 'Phương pháp Montessori tại nhà cho trẻ 3 tuổi',
      category: 'Giáo dục sớm',
      excerpt: 'Làm sao để áp dụng triết lý Montessori mà không cần mua giáo cụ đắt tiền? Cùng tìm hiểu 5 hoạt động đơn giản.',
      content: '', 
      image: 'https://picsum.photos/600/400?random=10',
      author: 'Dr. Asking Kids',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrKids',
      date: '20 Tháng 10, 2023',
      likes: 156,
      comments: []
    }
  ]);

  useEffect(() => {
    if (initialPostId) {
      const foundPost = posts.find(p => p.id === initialPostId);
      if (foundPost) {
        handleReadPost(foundPost);
      }
    }
  }, [initialPostId]);

  useEffect(() => {
    if (selectedPost?.id) {
      window.scrollTo(0, 0);
    }
  }, [selectedPost?.id]);

  const handleReadPost = async (post: BlogPost) => {
    setSelectedPost(post);
    setGeneratedContent(null);
    setAiLoading(true);
    if (post.content && post.content.length > 50) {
      setGeneratedContent(post.content);
      setAiLoading(false);
    } else {
      const content = await generateBlogArticle(post.title);
      setGeneratedContent(content);
      setAiLoading(false);
    }
  };

  const handleLike = () => {
    if(!selectedPost) return;
    const updatedPost = { ...selectedPost, likes: selectedPost.likes + 1 };
    setSelectedPost(updatedPost);
    setPosts(posts.map(p => p.id === selectedPost.id ? updatedPost : p));

    if(user) {
       updateUserPoints(2);
    } else {
       addNotification("Bạn đã thả tim! Đăng nhập để nhận điểm thưởng.", "SUCCESS");
    }
  };

  const handleSubmitComment = () => {
    if(!selectedPost || !commentInput.trim()) return;

    const newComment: BlogComment = {
      id: Date.now().toString(),
      author: user ? user.name : "Khách thăm",
      avatar: user ? user.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest${Date.now()}`,
      content: commentInput,
      timestamp: new Date().toLocaleString('vi-VN'),
      likes: 0,
      replies: []
    };

    const updatedPost = {
       ...selectedPost,
       comments: [newComment, ...selectedPost.comments]
    };

    setSelectedPost(updatedPost);
    setPosts(posts.map(p => p.id === selectedPost.id ? updatedPost : p));
    setCommentInput('');

    if(user) {
        updateUserPoints(5);
        addNotification("Bình luận thành công! (+5 điểm)", "SUCCESS");
    } else {
        addNotification("Bình luận thành công!", "SUCCESS");
    }
  };

  const handleReplySubmit = (parentId: string) => {
    if (!selectedPost || !replyInput.trim()) return;

    const newReply: BlogComment = {
        id: Date.now().toString(),
        author: user ? user.name : "Khách thăm",
        avatar: user ? user.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest${Date.now()}`,
        content: replyInput,
        timestamp: new Date().toLocaleString('vi-VN'),
        likes: 0,
        replies: []
    };

    const updateCommentTree = (comments: BlogComment[]): BlogComment[] => {
        return comments.map(c => {
            if (c.id === parentId) {
                return { ...c, replies: [...c.replies, newReply] };
            }
            if (c.replies.length > 0) {
                return { ...c, replies: updateCommentTree(c.replies) };
            }
            return c;
        });
    };

    const updatedComments = updateCommentTree(selectedPost.comments);
    const updatedPost = { ...selectedPost, comments: updatedComments };
    setSelectedPost(updatedPost);
    setPosts(posts.map(p => p.id === selectedPost.id ? updatedPost : p));
    
    setReplyingTo(null);
    setReplyInput('');

    if(user) {
        updateUserPoints(5);
        addNotification("Trả lời thành công! (+5 điểm)", "SUCCESS");
    }
  };

  const handleSubmitPost = () => {
    if (!writeTitle || !writeContent) return;

    const newPost: BlogPost = {
      id: Date.now().toString(),
      title: writeTitle,
      category: writeCategory,
      excerpt: writeContent.substring(0, 100) + '...',
      content: writeContent,
      image: `https://picsum.photos/600/400?random=${Date.now()}`,
      author: user ? user.name : 'Khách',
      authorAvatar: user?.avatar,
      date: new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }),
      likes: 0,
      comments: []
    };

    setPosts([newPost, ...posts]);
    setIsWriting(false);
    setWriteTitle('');
    setWriteContent('');
    addNotification('Bài viết của bạn đã được đăng thành công!', 'SUCCESS');
  };

  const handleSubscribe = () => {
    if (!newsletterEmail.trim()) return;
    addNotification('Đăng ký nhận tin thành công!', 'SUCCESS');
    setNewsletterEmail('');
    if(user) updateUserPoints(5);
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderComments = (comments: BlogComment[], depth = 0) => {
      const marginLeft = depth > 0 && depth <= 2 ? '24px' : '0px';
      
      return comments.map(comment => (
        <div 
          key={comment.id} 
          className={`flex flex-col relative ${depth > 0 ? 'mt-3' : 'mb-6'}`}
          style={{ marginLeft: marginLeft }} 
        > 
           {depth > 0 && (
             <div className="absolute top-0 -left-3 bottom-0 w-0.5 bg-gray-200/70 rounded-full"></div>
           )}

           <div className="flex gap-3">
              <img src={comment.avatar} alt="avt" className={`rounded-full bg-white border border-gray-200 flex-shrink-0 ${depth === 0 ? 'w-10 h-10' : 'w-8 h-8'}`} />
              <div className="flex-grow min-w-0"> 
                  <div className="bg-gray-100/80 p-3 rounded-2xl rounded-tl-none inline-block max-w-full">
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{comment.author}</h4>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 ml-2 font-bold">
                      <span>{comment.timestamp}</span>
                      <button className="hover:text-red-500 flex items-center gap-1 transition-colors">
                          <Heart size={12} className={comment.likes > 0 ? 'fill-red-500 text-red-500' : ''}/> {comment.likes || 'Thích'}
                      </button>
                      <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="hover:text-kid-blue transition-colors">
                          Trả lời
                      </button>
                  </div>

                  {replyingTo === comment.id && (
                      <div className="mt-2 flex gap-2 animate-in fade-in slide-in-from-top-2">
                        <input 
                          autoFocus
                          value={replyInput}
                          onChange={e => setReplyInput(e.target.value)}
                          placeholder={`Trả lời ${comment.author}...`}
                          className="flex-grow px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-kid-blue w-full min-w-0"
                          onKeyDown={e => e.key === 'Enter' && handleReplySubmit(comment.id)}
                        />
                        <button onClick={() => handleReplySubmit(comment.id)} className="bg-kid-blue text-white p-2 rounded-xl hover:bg-blue-600 flex-shrink-0">
                          <Send size={14} />
                        </button>
                      </div>
                  )}
              </div>
           </div>

           {comment.replies && comment.replies.length > 0 && (
              <div className="flex flex-col">
                  {renderComments(comment.replies, depth + 1)}
              </div>
           )}
        </div>
      ));
  };

  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white min-h-screen">
        <button 
          onClick={() => setSelectedPost(null)}
          className="group text-gray-500 hover:text-kid-blue mb-8 font-bold flex items-center gap-2 transition-colors"
        >
          <div className="bg-gray-100 p-2 rounded-full group-hover:bg-blue-50 transition-colors">
            <ArrowLeft size={20} />
          </div>
          Quay lại danh sách
        </button>

        <div className="relative h-64 md:h-[400px] rounded-3xl overflow-hidden mb-8 shadow-xl">
           <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
           <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white">
              <span className="bg-kid-pink text-white px-4 py-1.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider mb-3 inline-block shadow-sm">
                {selectedPost.category}
              </span>
           </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-8 leading-tight tracking-tight">{selectedPost.title}</h1>

        <div className="prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed whitespace-pre-line mb-12">
           {aiLoading ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-50 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
               <Sparkles className="animate-spin text-kid-blue w-12 h-12 mb-4" />
               <p className="font-bold text-gray-400">AI đang viết bài...</p>
             </div>
           ) : (
             generatedContent
           )}
        </div>

        <div className="border-t border-gray-100 pt-8 flex items-center justify-between mb-12">
           <button 
             onClick={handleLike}
             className="flex items-center gap-3 bg-red-50 text-red-500 font-bold px-6 py-3 rounded-full hover:bg-red-100 transition-all active:scale-95"
           >
              <Heart size={24} fill="currentColor" /> 
              <span className="text-xl">{selectedPost.likes}</span>
           </button>
        </div>

        <div className="bg-white border-t border-gray-100 pt-10 mb-12">
             <h3 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
                 <MessageSquare size={24} className="text-kid-blue"/> Bình luận ({selectedPost.comments.length})
             </h3>

             <div className="flex gap-4 mb-8">
                 <img 
                    src={user ? user.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest${Date.now()}`} 
                    className="w-10 h-10 rounded-full bg-white border border-gray-200"
                    alt="My Avatar"
                 />
                 <div className="flex-grow">
                     <textarea 
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        placeholder="Chia sẻ suy nghĩ của bạn..."
                        className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-kid-blue/50 min-h-[100px] bg-white"
                     />
                     <div className="flex justify-end mt-2">
                         <button 
                            onClick={handleSubmitComment}
                            disabled={!commentInput.trim()}
                            className="bg-kid-blue text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all"
                         >
                             Gửi bình luận
                         </button>
                     </div>
                 </div>
             </div>

             <div className="space-y-2">
                 {selectedPost.comments.length > 0 ? (
                    renderComments(selectedPost.comments)
                 ) : (
                    <p className="text-center text-gray-400 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                 )}
             </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
       <div className="text-center mb-10 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Blog Nuôi Dạy Con 👨‍👩‍👧‍👦</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => setIsWriting(!isWriting)}
            className="bg-kid-pink text-white font-bold px-6 py-3 rounded-full shadow-lg hover:bg-pink-600 transition-transform hover:scale-105 flex items-center gap-2"
          >
             <PenTool size={18} /> {isWriting ? 'Đóng khung soạn thảo' : 'Viết bài chia sẻ'}
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto mb-12 relative">
         <input 
            type="text" 
            placeholder="Tìm kiếm bài viết..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 focus:border-kid-blue focus:outline-none shadow-sm text-lg"
         />
         <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
      </div>

      {isWriting && (
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-12 border border-gray-100 animate-in fade-in slide-in-from-top-4 max-w-3xl mx-auto">
           <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
             <PenTool className="text-kid-pink"/> Viết bài mới
           </h3>
           <div className="space-y-4">
             <input type="text" value={writeTitle} onChange={e => setWriteTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-lg" placeholder="Tiêu đề..." />
             <textarea value={writeContent} onChange={e => setWriteContent(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 min-h-[200px]" placeholder="Nội dung..." />
             <button onClick={handleSubmitPost} className="px-8 py-3 bg-kid-pink text-white font-bold rounded-xl shadow-md">Đăng Bài</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <div key={post.id} className="flex flex-col gap-4 group cursor-pointer" onClick={() => handleReadPost(post)}>
              <div className="overflow-hidden rounded-2xl shadow-sm relative h-56">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-kid-blue transition-colors leading-tight">{post.title}</h3>
            </div>
          ))}
      </div>
    </div>
  );
};