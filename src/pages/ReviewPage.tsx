import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpenIcon, LightbulbIcon } from '../components/icons.tsx';

const ReviewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">复习功能已升级</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-2xl mx-auto">
          为了提供更统一、更强大的学习体验，独立的复习页面已被新的“复习模式”取代。
          您现在可以在“词汇”和“知识点”页面中直接进行艾宾浩斯复习。
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          <NavLink
            to="/words?view=review"
            className="flex items-center justify-center w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-md shadow-md transition-colors text-lg"
          >
            <BookOpenIcon className="w-6 h-6 mr-3" />
            开始复习词汇
          </NavLink>
          <NavLink
            to="/knowledge?view=review"
            className="flex items-center justify-center w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-md shadow-md transition-colors text-lg"
          >
            <LightbulbIcon className="w-6 h-6 mr-3" />
            开始复习知识点
          </NavLink>
        </div>
        <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
          只需进入相应页面，点击“今日复习”按钮即可开始。
        </p>
      </div>
    </div>
  );
};

export default ReviewPage;
