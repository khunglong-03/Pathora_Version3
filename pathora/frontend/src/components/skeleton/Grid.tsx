function Grid({ items, count = 6 }) {
  // set items length by count
  const displayItems = items || Array.from({ length: count });
  return (
    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
      {displayItems.map((_, i) => (
        <div
          className="rounded-xl bg-white dark:bg-slate-700 h-full p-6 shadow-md"
          key={i}
        >
          <div className="animate-pulse">
            <header className="flex justify-between items-center space-x-6">
              <div className="flex-1 flex items-center space-x-4">
                <div className="flex-none flex space-x-2 items-center">
                  <div className="h-10 w-10 rounded-sm bg-[#C4C4C4] dark:bg-slate-500"></div>
                </div>
                <div className="flex-1 bg-[#C4C4C4] dark:bg-slate-500 h-2 rounded-full"></div>
              </div>
              <div className="flex-none">
                <div className="h-6 w-6 rounded-full bg-[#C4C4C4] dark:bg-slate-500"></div>
              </div>
            </header>
            <div className="py-6 space-y-2">
              <div className="h-1.5 bg-[#C4C4C4] dark:bg-slate-500"></div>
              <div className="h-1.5 bg-[#C4C4C4] dark:bg-slate-500"></div>
              <div className="h-1.5 bg-[#C4C4C4] dark:bg-slate-500"></div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <span className="h-1 bg-[#C4C4C4] dark:bg-slate-500 block"></span>
                <span className="h-1 bg-[#C4C4C4] dark:bg-slate-500 block"></span>
              </div>

              <div className="space-y-2">
                <span className="h-1 bg-[#C4C4C4] dark:bg-slate-500 block"></span>
                <span className="h-1 bg-[#C4C4C4] dark:bg-slate-500 block"></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mt-6">
              <div className="flex -space-x-1">
                <div className="h-6 w-6 bg-[#C4C4C4] dark:bg-slate-500 rounded-full"></div>
                <div className="h-6 w-6 bg-[#C4C4C4] dark:bg-slate-500 rounded-full"></div>
                <div className="h-6 w-6 bg-[#C4C4C4] dark:bg-slate-500 rounded-full"></div>
              </div>
              <div>
                <span className="h-4.5 bg-[#C4C4C4] dark:bg-slate-500 w-32.5 inline-block rounded-full"></span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Grid;
