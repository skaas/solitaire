import { useState } from 'react';

interface StartScreenProps {
  onStart: (name: string, birthdate: string) => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    
    if (!birthdate) {
      alert('생년월일을 입력해주세요.');
      return;
    }
    
    onStart(name.trim(), birthdate);
  };

  return (
    <div className="min-h-screen bg-[#1a1625] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 무한대 아이콘 */}
        <div className="flex justify-center mb-8">
          <svg
            viewBox="0 0 200 100"
            className="w-24 h-12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M50 50C50 33.4315 63.4315 20 80 20C96.5685 20 110 33.4315 110 50C110 66.5685 123.431 80 140 80C156.569 80 170 66.5685 170 50C170 33.4315 156.569 20 140 20C123.431 20 110 33.4315 110 50C110 66.5685 96.5685 80 80 80C63.4315 80 50 66.5685 50 50Z"
              stroke="url(#gradient)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="50" y1="50" x2="170" y2="50">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* 제목 */}
        <h1 className="text-3xl font-bold text-white text-center mb-3">
          운명의 길을 열다
        </h1>

        {/* 부제목 */}
        <p className="text-gray-400 text-center mb-12 px-4 leading-relaxed">
          당신의 이름과 생년월일을 입력하여<br />
          미래의 실마리를 찾아보세요.
        </p>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 입력 */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z"
                  fill="currentColor"
                />
                <path
                  d="M10 12C4.47715 12 0 14.4772 0 17.5C0 18.8807 4.47715 20 10 20C15.5228 20 20 18.8807 20 17.5C20 14.4772 15.5228 12 10 12Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="w-full bg-[#2d2440] border border-purple-800/50 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 transition-colors"
            />
          </div>

          {/* 생년월일 입력 */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8C2 6.89543 2.89543 6 4 6H16C17.1046 6 18 6.89543 18 8V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V8Z"
                  fill="currentColor"
                />
                <path
                  d="M6 2V5M14 2V5M2 8H18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              placeholder="mm/dd/yyyy"
              className="w-full bg-[#2d2440] border border-purple-800/50 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* 시작하기 버튼 */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-purple-500/50 mt-8"
          >
            시작하기
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartScreen;

