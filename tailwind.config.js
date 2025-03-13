/** @type {import('tailwindcss').Config} */
import flowbitePlugin from 'flowbite/plugin';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    'node_modules/flowbite-react/lib/esm/**/*.js',
    './node_modules/flowbite/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        user: 'rgb(59, 130, 246)',      // blue-500
        customer: 'rgb(34, 197, 94)',    // green-500
        skill: 'rgb(168, 85, 247)',      // purple-500
        'user-skill': 'rgb(129, 140, 248)', // indigo-400
        'user-customer': 'rgb(20, 184, 166)', // teal-500
        'customer-skill': 'rgb(163, 230, 53)', // lime-400
        'customer-user': 'rgb(34, 211, 238)', // cyan-400
        'skill-customer': 'rgb(107, 33, 168)', // purple-800
        'skill-user': 'rgb(67, 56, 202)',    // indigo-700
      },
    },
  },
  plugins: [
    flowbitePlugin,
  ],
  darkMode: 'class',
}