import React from 'react';
import { Home, Users, Trophy, Info, ShoppingCart, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import SelectedLeagueInfo from '../SelectedLeagueInfo/SelectedLeagueInfo';

const Sidebar = ({ isOpen }) => {
  const sidebarMenuItems = [
    { icon: <Home />, text: 'Mis ligas', path: '/' },
    { icon: <Users />, text: 'Equipo', path: '/team' },
    { icon: <Trophy />, text: 'Clasificación', path: '/leaderboard' },
    { icon: <Info />, text: 'Información general', path: '/info' },
    { icon: <ShoppingCart />, text: 'Mercado', path: '/market' },
    { icon: <Activity />, text: 'Actividad reciente', path: '/activity' }
  ];

  return (
    <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
      {isOpen && (
        <div className="sidebar-league-info">
          <SelectedLeagueInfo />
        </div>
      )}

      <ul className="sidebar-menu">
        {sidebarMenuItems.map((item, index) => (
          <li key={index} className="sidebar-menu-item">
            <Link to={item.path} className="sidebar-link">
              {item.icon}
              {isOpen && <span className="sidebar-menu-item-text">{item.text}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;