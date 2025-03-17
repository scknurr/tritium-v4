import React, { useState, useEffect } from 'react';
import { Card, Button } from 'flowbite-react';
import { Quote, RefreshCw } from 'lucide-react';

// Array of inspirational quotes about skills, teamwork, and growth
const quotes = [
  { text: "The only skill that will be important in the 21st century is the skill of learning new skills.", author: "John Hagel" },
  { text: "Talent wins games, but teamwork and intelligence win championships.", author: "Michael Jordan" },
  { text: "Individual commitment to a group effort—that is what makes a team work, a company work, a society work, a civilization work.", author: "Vince Lombardi" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
  { text: "Great things in business are never done by one person; they're done by a team of people.", author: "Steve Jobs" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.", author: "Pelé" },
  { text: "The most valuable skill you can have is knowing how to learn.", author: "Elon Musk" },
  { text: "Your skills may serve you well, but your mindset will define your success.", author: "Unknown" },
  { text: "If you're not making mistakes, then you're not making decisions.", author: "Catherine Cook" },
  { text: "The best preparation for tomorrow is doing your best today.", author: "H. Jackson Brown Jr." },
  { text: "The best teams have chemistry. They communicate well and respond to each other instinctively.", author: "Pat Summitt" },
  { text: "Skills are cheap. Passion is priceless.", author: "Gary Vaynerchuk" },
  { text: "The art of communication is the language of leadership.", author: "James Humes" },
  { text: "Success isn't about how much money you make; it's about the difference you make in people's lives.", author: "Michelle Obama" },
  { text: "Continuous learning is the minimum requirement for success in any field.", author: "Denis Waitley" },
  { text: "Invest in your skills, and your skills will invest in you.", author: "Unknown" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" }
];

export function RandomQuote() {
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [animation, setAnimation] = useState(false);

  // Function to get a random quote
  const getRandomQuote = () => {
    setAnimation(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      // Ensure we have a valid quote by using null coalescing
      const selectedQuote = quotes[randomIndex] || { text: "Wisdom is knowing what to do; skill is knowing how to do it.", author: "Anonymous" };
      setQuote(selectedQuote);
      setAnimation(false);
    }, 300); // Short delay for animation
  };

  // Get a random quote on component mount
  useEffect(() => {
    getRandomQuote();
  }, []);

  return (
    <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl border-0">
      <div className={`flex flex-col space-y-4 transition-opacity duration-300 ${animation ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-start">
          <Quote className="w-8 h-8 text-indigo-200 flex-shrink-0 mr-3" />
          <div>
            <p className="text-lg font-medium mb-2">{quote.text}</p>
            <p className="text-sm text-indigo-200">— {quote.author}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            size="sm" 
            color="light" 
            onClick={getRandomQuote}
            className="mt-2 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            New Quote
          </Button>
        </div>
      </div>
    </Card>
  );
} 