
import React from 'react';
import { BotAppTemplate } from './BotAppTemplate';

/**
 * These components are now wrappers around the generic BotAppTemplate.
 * This allows for easy instantiation and consistent UI across all "apps".
 */

export const NBABot = () => (
    <BotAppTemplate config={{
        sport: 'nba',
        title: 'NBA Courtside AI',
        themeColor: 'bg-orange-500',
        accentColor: 'text-orange-500'
    }} />
);

export const SoccerBot = () => (
    <BotAppTemplate config={{
        sport: 'soccer',
        title: 'Global Soccer Scout',
        themeColor: 'bg-green-500',
        accentColor: 'text-green-500'
    }} />
);

export const NFLBot = () => (
    <BotAppTemplate config={{
        sport: 'nfl',
        title: 'Gridiron Analytics',
        themeColor: 'bg-blue-600',
        accentColor: 'text-blue-500'
    }} />
);

export const TennisBot = () => (
    <BotAppTemplate config={{
        sport: 'tennis',
        title: 'Ace Tennis Tracker',
        themeColor: 'bg-yellow-500',
        accentColor: 'text-yellow-500'
    }} />
);

export const TableTennisBot = () => (
    <BotAppTemplate config={{
        sport: 'tt',
        title: 'Ping Pong Pro',
        themeColor: 'bg-purple-500',
        accentColor: 'text-purple-500'
    }} />
);
