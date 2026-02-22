import CommentSection from '../CommentSection';

export default function CommentSectionExample() {
  const mockComments = [
    {
      id: '1',
      username: 'johndoe',
      text: 'This is amazing! Love the design.',
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: '2',
      username: 'janedoe',
      text: 'Great work! Keep it up.',
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <CommentSection
        comments={mockComments}
        onAddComment={(text) => console.log('New comment:', text)}
      />
    </div>
  );
}
