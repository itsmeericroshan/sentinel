export default function Navbar({ page, setPage }) {
  return (
    <nav style={{background:'#1A1A1A'}} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button onClick={() => setPage('dashboard')} className="flex items-center gap-3 py-4">
          <span style={{color:'#FF3333',fontFamily:'Georgia,serif',fontSize:'26px',fontWeight:'900',letterSpacing:'0.1em'}}>SENTINEL</span>
          <span className="hidden sm:block text-xs text-gray-400 mt-1">AI Industrial Safety Intelligence</span>
        </button>
        <div className="flex items-center gap-1">
          {[
            {id:'dashboard',label:'Live Dashboard'},
            {id:'how',label:'How It Works'},
            {id:'about',label:'About'},
          ].map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`px-4 py-5 text-sm font-medium transition-all border-b-2
                ${page===item.id?'border-red-500 text-red-400':'border-transparent text-gray-300 hover:text-white'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
