import React from 'react';
import { BlogResult } from '../types';
import { ViewIcon, DeleteIcon } from './icons/NavIcons';

interface HistoryProps {
  history: BlogResult[];
  onView: (item: BlogResult) => void;
  onDelete: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ history, onView, onDelete }) => {
  return (
    <div className="space-y-8 bg-gray-800/50 backdrop-blur-sm p-6 md:p-8 rounded-lg shadow-2xl border border-gray-700">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Blog Generation History</h1>
        <p className="text-gray-400 mt-2">Review, preview, or delete your previously generated blog posts.</p>
      </div>
      
      <div className="mt-6 flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {history.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-0">
                      Title
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                      Date Created
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0">
                        {item.title}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <div className="flex justify-end gap-4">
                            <button onClick={() => onView(item)} className="text-indigo-400 hover:text-indigo-300 transition-colors" title="View">
                                <ViewIcon />
                            </button>
                            <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Delete">
                                <DeleteIcon />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-300">No History Yet</h3>
                    <p className="mt-1 text-gray-400">Start by generating a new blog post. Your results will appear here.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
