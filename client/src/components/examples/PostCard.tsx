import PostCard from '../PostCard';

export default function PostCardExample() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <PostCard
        id="1"
        rank={1}
        imageUrl="https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=800&h=600&fit=crop"
        caption="This is an amazing post about AI and technology! Really excited to share this with everyone."
        username="techguru"
        votes={42}
        createdAt={new Date(Date.now() - 1000 * 60 * 30)}
        userVoted={true}
        commentsCount={12}
        onVoteUp={() => console.log('Vote up')}
        onVoteDown={() => console.log('Vote down')}
        onComment={() => console.log('Comment')}
      />
      <PostCard
        id="2"
        rank={2}
        imageUrl="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop"
        caption="Beautiful art work here!"
        username="artlover"
        votes={35}
        createdAt={new Date(Date.now() - 1000 * 60 * 60)}
        commentsCount={8}
        onVoteUp={() => console.log('Vote up')}
        onVoteDown={() => console.log('Vote down')}
        onComment={() => console.log('Comment')}
      />
    </div>
  );
}
