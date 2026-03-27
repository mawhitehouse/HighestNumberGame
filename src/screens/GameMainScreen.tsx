// src/screens/GameMainScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  LayoutAnimation, UIManager, Platform, SafeAreaView, Alert, Vibration 
} from 'react-native';

import { generateDeck, drawCards } from '../utils/deck';
import Card from '../components/Card';
import { PlayingCard, PlayerProfile } from '../types';
import { getProfiles, updateProfile } from '../utils/storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const smoothAnimation = { duration: 300, create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity }, update: { type: LayoutAnimation.Types.easeInEaseOut } };
const PLACE_NAMES = ['Ones', 'Tens', 'Hundreds', 'Thousands', 'Ten Thousands'];
interface Question { place: string; targetIndex: number; }

export default function GameMainScreen(props: any) {
  const level = props?.route?.params?.level || 2; 
  const totalRounds = props?.route?.params?.rounds || 3; 
  const questionsEnabled = props?.route?.params?.questionsEnabled ?? true;
  
  const p1Profile = props?.route?.params?.p1Profile || { name: 'Player 1', colorHex: '#1982C4', iconName: 'rocket' };
  const p2Profile = props?.route?.params?.p2Profile || { name: 'Player 2', colorHex: '#FF924C', iconName: 'star' };
  
  const handCardWidth = level === 5 ? 60 : 80;
  const slotCardWidth = level === 5 ? 55 : 70;

  const [activePhase, setActivePhase] = useState<0 | 1 | 2>(0);
  
  // NEW: Default to Side-by-Side mode!
  const [isOppositeMode, setIsOppositeMode] = useState(false); 
  
  const [isGameFinished, setIsGameFinished] = useState(false);
  
  // NEW: Dealing state to lock the board while cards "deal"
  const [isDealing, setIsDealing] = useState(false); 

  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [currentRound, setCurrentRound] = useState(1); 

  const [p1HasPlayed, setP1HasPlayed] = useState(false);
  const [p2HasPlayed, setP2HasPlayed] = useState(false);

  const [isComparingPhase, setIsComparingPhase] = useState(false);
  const [p1Guess, setP1Guess] = useState<1 | 2 | null>(null);
  const [p2Guess, setP2Guess] = useState<1 | 2 | null>(null);

  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [p1Hand, setP1Hand] = useState<(PlayingCard | null)[]>([]);
  const [p2Hand, setP2Hand] = useState<(PlayingCard | null)[]>([]);
  const [p1Slots, setP1Slots] = useState<(PlayingCard | null)[]>([]);
  const [p2Slots, setP2Slots] = useState<(PlayingCard | null)[]>([]);

  const [p1TargetNumber, setP1TargetNumber] = useState<number>(0);
  const [p2TargetNumber, setP2TargetNumber] = useState<number>(0);

  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);
  const [p1SelectedIdx, setP1SelectedIdx] = useState<number | null>(null);
  const [p2SelectedIdx, setP2SelectedIdx] = useState<number | null>(null);

  const [deckPattern, setDeckPattern] = useState<any>('star'); 

  const [isQuestionPhase, setIsQuestionPhase] = useState(false);
  const [activeQPlayer, setActiveQPlayer] = useState<1 | 2 | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);

  useEffect(() => {
    const unsubscribe = props.navigation.addListener('beforeRemove', (e: any) => {
      if (isGameFinished) return; 
      e.preventDefault();
      Alert.alert('Leave Game?', 'Are you sure? Your progress will be lost!', [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        { text: 'Leave', style: 'destructive', onPress: () => props.navigation.dispatch(e.data.action) },
      ]);
    });
    return unsubscribe;
  }, [props.navigation, isGameFinished]);

  useEffect(() => {
    startNewRound();
  }, []); // Only runs on first mount. Subsequent rounds are triggered manually.

  // CPU AUTOMATON
  useEffect(() => {
    // NEW: Ensure the CPU doesn't try to play while the cards are still dealing
    if (activePhase === 2 && p2Profile.id === 'cpu' && !p2HasPlayed && !isComparingPhase && !isDealing) {
      const timer = setTimeout(() => {
        const sortedCards = [...p2Hand].filter(c => c !== null).sort((a, b) => b!.value - a!.value);
        setP2Slots(sortedCards);
        setP2Hand(Array(level).fill(null));
        triggerTurnOver(2);
      }, 1500); 
      return () => clearTimeout(timer);
    }
  }, [activePhase, p2Profile.id, p2HasPlayed, isComparingPhase, p2Hand, level, isDealing]);

  const calculateHighestNumber = (cards: PlayingCard[]) => {
    const sortedValues = [...cards].map(c => c.value).sort((a, b) => b - a);
    return parseInt(sortedValues.join(''), 10);
  };

  const startNewRound = () => {
    const newDeck = generateDeck();
    const { drawn: p1Cards, remainingDeck: deckAfterP1 } = drawCards(newDeck, level);
    const { drawn: p2Cards, remainingDeck: deckAfterP2 } = drawCards(deckAfterP1, level);

    setDeck(deckAfterP2);
    setP1Hand(p1Cards);
    setP2Hand(p2Cards);
    setP1TargetNumber(calculateHighestNumber(p1Cards));
    setP2TargetNumber(calculateHighestNumber(p2Cards));
    
    setP1Slots(Array(level).fill(null));
    setP2Slots(Array(level).fill(null));
    setFlippedCardIds([]);
    setP1SelectedIdx(null);
    setP2SelectedIdx(null);
    setIsQuestionPhase(false);
    setP1HasPlayed(false);
    setP2HasPlayed(false);
    setIsComparingPhase(false);
    setP1Guess(null);
    setP2Guess(null);

    const chosenPattern = Math.random() > 0.5 ? p1Profile.iconName : p2Profile.iconName;
    setDeckPattern(chosenPattern);

    // --- NEW: THE DEALING SEQUENCE ---
    setIsDealing(true);
    setActivePhase(0); // Force the 50/50 view so both players see their cards appear
    LayoutAnimation.configureNext(smoothAnimation);

    // Wait 1.5 seconds, then auto-zoom to the starting player
    setTimeout(() => {
      setIsDealing(false);
      
      // Calculate who starts based on score! Lower score goes first.
      // Note: Because setState runs asynchronously, we use the local state values here.
      // If it's a tie (like Round 1 where both are 0), Player 1 goes first.
      const startingPlayer = p2Score < p1Score ? 2 : 1;
      
      togglePhase(startingPlayer);
    }, 1500);
  };

  const togglePhase = (phase: 0 | 1 | 2) => {
    LayoutAnimation.configureNext(smoothAnimation);
    setActivePhase(phase);
  };

  const toggleMode = () => {
    LayoutAnimation.configureNext(smoothAnimation);
    setIsOppositeMode(!isOppositeMode);
  };

  const triggerTurnOver = (player: 1 | 2) => {
    if (player === 1) {
      setP1HasPlayed(true);
      if (p2HasPlayed) { 
        setIsComparingPhase(true); togglePhase(0); 
      } else { 
        const msg = p2Profile.id === 'cpu' ? "Great job! The Robot is thinking..." : `You nailed it! ${p2Profile.name}, your turn!`;
        Alert.alert("Perfect!", msg, [{ text: "Let's Go!", onPress: () => togglePhase(2) }]); 
      }
    } else {
      setP2HasPlayed(true);
      if (p1HasPlayed) { 
        setIsComparingPhase(true); togglePhase(0); 
      } else { 
        const title = p2Profile.id === 'cpu' ? "Beep Boop!" : "Perfect!";
        const msg = p2Profile.id === 'cpu' ? "The Robot has locked in its number. Show it what you've got!" : `You nailed it! ${p1Profile.name}, your turn!`;
        Alert.alert(title, msg, [{ text: "Let's Go!", onPress: () => togglePhase(1) }]); 
      }
    }
  };

  // NEW: The Security Guard now blocks ALL taps while cards are dealing
  const canPlayerInteract = (player: 1 | 2) => {
    if (isDealing) return false; 
    if (isComparingPhase || isQuestionPhase) return false; 
    if (player === 1 && p1HasPlayed) return false; 
    if (player === 2 && p2HasPlayed) return false; 
    if (activePhase !== 0 && activePhase !== player) return false; 
    if (player === 2 && p2Profile.id === 'cpu') return false; 
    return true; 
  };

  const handleRevealResults = () => {
    let actualWinner: 1 | 2 | 'tie' = 'tie';
    if (p1TargetNumber > p2TargetNumber) actualWinner = 1;
    if (p2TargetNumber > p1TargetNumber) actualWinner = 2;

    const p1Correct = p1Guess === actualWinner;
    const cpuGuess = Math.random() > 0.5 ? 1 : 2; 
    const p2Correct = p2Profile.id === 'cpu' ? (cpuGuess === actualWinner) : (p2Guess === actualWinner);

    const saveStats = async () => {
      const p1Win = actualWinner === 1;
      const p2Win = actualWinner === 2;
      const isTie = actualWinner === 'tie';

      const updateStatsForProfile = async (profile: PlayerProfile, isWin: boolean, tie: boolean, correctGuess: boolean, builtNum: number) => {
        if (profile.id === 'guest' || profile.id === 'cpu') return; 
        const allProfiles = await getProfiles();
        const freshProfile = allProfiles.find(p => p.id === profile.id);
        if (!freshProfile) return;

        freshProfile.stats.gamesPlayed += 1;
        if (isWin) freshProfile.stats.wins += 1;
        if (tie) freshProfile.stats.ties += 1;
        if (correctGuess) freshProfile.stats.correctGuesses += 1;

        if (level === 2 && builtNum > freshProfile.stats.highestNumber2Card) freshProfile.stats.highestNumber2Card = builtNum;
        if (level === 3 && builtNum > freshProfile.stats.highestNumber3Card) freshProfile.stats.highestNumber3Card = builtNum;
        if (level === 4 && builtNum > freshProfile.stats.highestNumber4Card) freshProfile.stats.highestNumber4Card = builtNum;
        if (level === 5 && builtNum > freshProfile.stats.highestNumber5Card) freshProfile.stats.highestNumber5Card = builtNum;

        await updateProfile(freshProfile);
      };

      await updateStatsForProfile(p1Profile, p1Win, isTie, p1Correct, p1TargetNumber);
      await updateStatsForProfile(p2Profile, p2Win, isTie, p2Correct, p2TargetNumber);
    };

    saveStats(); 

    let p1RoundPoints = 0;
    let p2RoundPoints = 0;
    let msg = "";
    
    if (actualWinner === 'tie') {
      msg += `It's a tie! Both made ${p1TargetNumber}.\n\n`;
    } else if (actualWinner === 1) {
      msg += `${p1Profile.name} had the highest number! (${p1TargetNumber})\n⭐ +1 Point to ${p1Profile.name}\n\n`;
      p1RoundPoints += 1;
    } else {
      msg += `${p2Profile.name} had the highest number! (${p2TargetNumber})\n⭐ +1 Point to ${p2Profile.name}\n\n`;
      p2RoundPoints += 1;
    }

    if (p1Correct) {
      msg += `${p1Profile.name} guessed right! ✅ (+1 Point)\n`;
      p1RoundPoints += 1;
    } else {
      msg += `${p1Profile.name} guessed wrong. ❌\n`;
    }

    if (p2Correct) {
      msg += `${p2Profile.name} guessed right! ✅ (+1 Point)`;
      p2RoundPoints += 1;
    } else {
      msg += `${p2Profile.name} guessed wrong. ❌`;
    }

    // We must pass the functional updates down so the startNewRound closure gets the fresh scores
    setP1Score(prev => {
      const finalP1 = prev + p1RoundPoints;
      setP2Score(prev2 => {
        const finalP2 = prev2 + p2RoundPoints;
        
        if (currentRound >= totalRounds) {
          let finalMsg = `Final Score:\n${p1Profile.name}: ${finalP1}\n${p2Profile.name}: ${finalP2}\n\n`;
          if (finalP1 > finalP2) finalMsg += `${p1Profile.name} Wins the Game! 🏆`;
          else if (finalP2 > finalP1) finalMsg += `${p2Profile.name} Wins the Game! 🏆`;
          else finalMsg += "It's a tie game! 🤝";

          setIsGameFinished(true); 

          Alert.alert("Game Over!", finalMsg, [
            { text: "Finish", onPress: () => props.navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) }
          ]);
        } else {
          Alert.alert(`Round ${currentRound} Results!`, msg, [
            { text: `Start Round ${currentRound + 1}`, onPress: () => {
                setCurrentRound(r => r + 1);
                // Call startNewRound manually here. The states for score won't be updated in the closure yet, 
                // but our setTimeOut inside startNewRound reads the global state which React will have updated by the time it fires!
                startNewRound();
            }}
          ]);
        }
        return finalP2;
      });
      return finalP1;
    });
  };

  const handleCardSwipe = (player: 1 | 2, handIndex: number) => {
    if (!canPlayerInteract(player)) return; 
    
    const hand = player === 1 ? [...p1Hand] : [...p2Hand];
    const slots = player === 1 ? [...p1Slots] : [...p2Slots];
    const cardToMove = hand[handIndex];
    
    if (!cardToMove || !flippedCardIds.includes(cardToMove.id)) return;

    const emptySlotIdx = slots.findIndex(s => s === null);
    if (emptySlotIdx !== -1) {
      slots[emptySlotIdx] = cardToMove;
      hand[handIndex] = null;
      if (player === 1) { setP1Hand(hand); setP1Slots(slots); setP1SelectedIdx(null); } 
      else { setP2Hand(hand); setP2Slots(slots); setP2SelectedIdx(null); }
      Vibration.vibrate(150);
    }
  };

  const handleHandCardTap = (player: 1 | 2, handIndex: number) => {
    if (!canPlayerInteract(player)) return; 

    const hand = player === 1 ? p1Hand : p2Hand;
    const card = hand[handIndex];
    if (!card) return;
    if (!flippedCardIds.includes(card.id)) { setFlippedCardIds(prev => [...prev, card.id]); return; }
    if (player === 1) setP1SelectedIdx(p1SelectedIdx === handIndex ? null : handIndex);
    else setP2SelectedIdx(p2SelectedIdx === handIndex ? null : handIndex);
  };

  const handleSlotTap = (player: 1 | 2, slotIndex: number) => {
    if (isComparingPhase) return;

    if (isQuestionPhase) {
      if (activeQPlayer === player) {
        const currentQ = currentQuestions[currentQIdx];
        if (slotIndex === currentQ.targetIndex) {
          Vibration.vibrate(50);
          if (currentQIdx + 1 < currentQuestions.length) { 
            setCurrentQIdx(currentQIdx + 1); 
          } else {
            setIsQuestionPhase(false); 
            setActiveQPlayer(null);
            triggerTurnOver(player);
          }
        } else {
          Vibration.vibrate([0, 100, 100, 100]); 
          Alert.alert("Oops!", `That's not the ${currentQ.place} place. Try again!`);
        }
      }
      return; 
    }

    if (!canPlayerInteract(player)) return; 

    const hand = player === 1 ? [...p1Hand] : [...p2Hand];
    const slots = player === 1 ? [...p1Slots] : [...p2Slots];
    const selectedIdx = player === 1 ? p1SelectedIdx : p2SelectedIdx;

    if (selectedIdx !== null) {
      const cardToMove = hand[selectedIdx];
      if (slots[slotIndex] !== null) { hand[selectedIdx] = slots[slotIndex]; } else { hand[selectedIdx] = null; }
      slots[slotIndex] = cardToMove;
      if (player === 1) { setP1Hand(hand); setP1Slots(slots); setP1SelectedIdx(null); } 
      else { setP2Hand(hand); setP2Slots(slots); setP2SelectedIdx(null); }
      Vibration.vibrate(150);
    } else if (slots[slotIndex] !== null) {
      const cardToReturn = slots[slotIndex];
      const emptyHandIdx = hand.findIndex(c => c === null); 
      if (emptyHandIdx !== -1) {
        hand[emptyHandIdx] = cardToReturn;
        slots[slotIndex] = null;
        if (player === 1) { setP1Hand(hand); setP1Slots(slots); } else { setP2Hand(hand); setP2Slots(slots); }
        Vibration.vibrate(150);
      }
    }
  };

  const handleConfirm = (player: 1 | 2) => {
    const slots = player === 1 ? p1Slots : p2Slots;
    const target = player === 1 ? p1TargetNumber : p2TargetNumber;
    
    if (slots[0]?.value === 0) {
      Vibration.vibrate([0, 100, 100, 100]);
      Alert.alert("Hold On!", "Whole numbers don't usually start with zero. Try moving it to a different spot!");
      return;
    }

    const builtString = slots.map(c => c?.value).join('');
    const builtNumber = parseInt(builtString, 10);

    if (builtNumber === target) {
      Vibration.vibrate(50);
      if (!questionsEnabled) {
        triggerTurnOver(player);
        return;
      }

      const numQuestions = 1; 
      const possibleIndices = Array.from({length: level}, (_, i) => i);
      const shuffledIndices = possibleIndices.sort(() => Math.random() - 0.5);
      const selectedIndices = shuffledIndices.slice(0, numQuestions);
      const generatedQs = selectedIndices.map(idx => ({ targetIndex: idx, place: PLACE_NAMES[level - 1 - idx] }));

      setCurrentQuestions(generatedQs);
      setCurrentQIdx(0);
      setIsQuestionPhase(true);
      setActiveQPlayer(player);
    } else {
      Vibration.vibrate([0, 100, 100, 100]);
      Alert.alert("Check Again", "That is a great number, but can you make a BIGGER one?");
    }
  };

  const player2Flex = activePhase === 2 ? 7.5 : activePhase === 1 ? 2.5 : 5;
  const player1Flex = activePhase === 1 ? 7.5 : activePhase === 2 ? 2.5 : 5;
  const p2Scale = activePhase === 1 ? 0.75 : 1;
  const p1Scale = activePhase === 2 ? 0.75 : 1;

  const p1IsReady = p1Slots.every(slot => slot !== null);
  const p2IsReady = p2Slots.every(slot => slot !== null);

  const renderQuestionBanner = (player: 1 | 2) => {
    if (isQuestionPhase && activeQPlayer === player) {
      return (
        <View style={styles.questionBanner}>
          <Text style={styles.questionText}>Tap the number in the <Text style={{fontWeight: 'bold', color: '#EF476F'}}>{currentQuestions[currentQIdx].place}</Text> place!</Text>
        </View>
      );
    }
    return null;
  };

  const renderVotingPanel = (player: 1 | 2) => {
    if (!isComparingPhase) return null;
    
    if (player === 2 && p2Profile.id === 'cpu') {
      return (
        <View style={styles.votingPanel}>
          <Text style={styles.voteTitle}>Robot is voting...</Text>
          <Text style={styles.readyText}>Locked in! ✅</Text>
        </View>
      );
    }

    const currentGuess = player === 1 ? p1Guess : p2Guess;
    const setGuess = player === 1 ? setP1Guess : setP2Guess;

    return (
      <View style={styles.votingPanel}>
        <Text style={styles.voteTitle}>Which number is higher?</Text>
        <View style={styles.voteRow}>
          <TouchableOpacity style={[styles.voteBtn, currentGuess === 1 && { borderColor: p1Profile.colorHex, backgroundColor: p1Profile.colorHex + '20' }]} onPress={() => setGuess(1)}>
            <Text style={[styles.voteBtnText, currentGuess === 1 && { color: p1Profile.colorHex }]}>{p1Profile.name}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.voteBtn, currentGuess === 2 && { borderColor: p2Profile.colorHex, backgroundColor: p2Profile.colorHex + '20' }]} onPress={() => setGuess(2)}>
            <Text style={[styles.voteBtnText, currentGuess === 2 && { color: p2Profile.colorHex }]}>{p2Profile.name}</Text>
          </TouchableOpacity>
        </View>
        {currentGuess && <Text style={styles.readyText}>Locked in! ✅</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        
        {/* --- PLAYER 2 ZONE --- */}
        <View style={[styles.playerZone, { flex: player2Flex, backgroundColor: p2Profile.colorHex + '20' }]}>
          <View style={[styles.contentWrapper, { transform: [{ rotate: isOppositeMode ? '180deg' : '0deg' }, { scale: p2Scale }] }]}>
            <Text style={[styles.zoneTitle, { color: p2Profile.colorHex }]}>{p2Profile.name}</Text>
            
            {/* Hide instructions while dealing! */}
            {!p2HasPlayed && !isComparingPhase && !isDealing && p2Profile.id !== 'cpu' && <Text style={{color: '#666', fontWeight: 'bold', marginBottom: 5}}>Make the largest number!</Text>}
            
            {!isComparingPhase ? (
              <View style={styles.cardRow}>
                {p2Hand.map((card, index) => (
                  card ? <Card key={card.id} card={card} isFaceUp={flippedCardIds.includes(card.id) || p2Slots.includes(card)} isSelected={p2SelectedIdx === index} onPress={() => handleHandCardTap(2, index)} onSwipe={() => handleCardSwipe(2, index)} pattern={deckPattern} width={handCardWidth} /> : <View key={`empty-hand-${index}`} style={[styles.emptyCardPlaceholder, { width: handCardWidth }]} />
                ))}
              </View>
            ) : renderVotingPanel(2)}
            
            {renderQuestionBanner(2)}

            <View style={{ alignItems: 'center', gap: 10 }}>
              <View style={styles.slotRow}>
                {p2Slots.map((slotCard, index) => (
                  <TouchableOpacity key={`slot-${index}`} activeOpacity={0.8} onPress={() => handleSlotTap(2, index)}>
                    {slotCard ? <Card card={slotCard} isFaceUp={true} width={slotCardWidth} /> : <View style={[styles.emptySlot, { width: slotCardWidth }]} />}
                  </TouchableOpacity>
                ))}
              </View>
              {p2IsReady && !isQuestionPhase && !p2HasPlayed && !isComparingPhase && p2Profile.id !== 'cpu' && (
                <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(2)}>
                  <Text style={styles.confirmBtnText}>Confirm Number ✔️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* --- DIVIDER --- */}
        <View style={styles.divider}>
          <Text style={[styles.scoreText, { color: p1Profile.colorHex }]}>{p1Profile.name}: {p1Score}</Text>
          {isDealing ? (
             <Text style={[styles.dividerText, { color: '#FFD166' }]}>Dealing Cards...</Text>
          ) : isComparingPhase && p1Guess && (p2Guess || p2Profile.id === 'cpu') ? (
            <TouchableOpacity style={styles.revealBtn} onPress={handleRevealResults}>
               <Text style={styles.revealBtnText}>Reveal Results!</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.dividerText}>Round {currentRound} of {totalRounds}</Text>
          )}
          <Text style={[styles.scoreText, { color: p2Profile.colorHex }]}>{p2Profile.name}: {p2Score}</Text>
        </View>

        {/* --- PLAYER 1 ZONE --- */}
        <View style={[styles.playerZone, { flex: player1Flex, backgroundColor: p1Profile.colorHex + '20' }]}>
          <View style={[styles.contentWrapper, { transform: [{ scale: p1Scale }] }]}>
            <Text style={[styles.zoneTitle, { color: p1Profile.colorHex }]}>{p1Profile.name}</Text>
            
            {/* Hide instructions while dealing! */}
            {!p1HasPlayed && !isComparingPhase && !isDealing && <Text style={{color: '#666', fontWeight: 'bold', marginBottom: 5}}>Make the largest number!</Text>}

            {renderQuestionBanner(1)}

            <View style={{ alignItems: 'center', gap: 10 }}>
              <View style={styles.slotRow}>
                {p1Slots.map((slotCard, index) => (
                  <TouchableOpacity key={`slot-${index}`} activeOpacity={0.8} onPress={() => handleSlotTap(1, index)}>
                    {slotCard ? <Card card={slotCard} isFaceUp={true} width={slotCardWidth} /> : <View style={[styles.emptySlot, { width: slotCardWidth }]} />}
                  </TouchableOpacity>
                ))}
              </View>
              {p1IsReady && !isQuestionPhase && !p1HasPlayed && !isComparingPhase && (
                <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(1)}>
                  <Text style={styles.confirmBtnText}>Confirm Number ✔️</Text>
                </TouchableOpacity>
              )}
            </View>

            {!isComparingPhase ? (
              <View style={styles.cardRow}>
                {p1Hand.map((card, index) => (
                  card ? <Card key={card.id} card={card} isFaceUp={flippedCardIds.includes(card.id)} isSelected={p1SelectedIdx === index} onPress={() => handleHandCardTap(1, index)} onSwipe={() => handleCardSwipe(1, index)} pattern={deckPattern} width={handCardWidth} /> : <View key={`empty-hand-${index}`} style={[styles.emptyCardPlaceholder, { width: handCardWidth }]} />
                ))}
              </View>
            ) : renderVotingPanel(1)}
          </View>
        </View>

      </View>

      {/* --- CONTROLS --- */}
      {!isComparingPhase && !isDealing && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.modeBtn} onPress={toggleMode}>
            <Text style={styles.modeBtnText}>Mode: {isOppositeMode ? "Opposite" : "Side-by-Side"}</Text>
          </TouchableOpacity>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.btn} onPress={() => togglePhase(1)}><Text style={styles.btnText}>{p1Profile.name}'s Turn</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => togglePhase(0)}><Text style={styles.btnText}>50/50</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => togglePhase(2)}><Text style={styles.btnText}>{p2Profile.name}'s Turn</Text></TouchableOpacity>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, 
  playerZone: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  contentWrapper: { alignItems: 'center', justifyContent: 'center', width: '100%', gap: 15 },
  zoneTitle: { fontSize: 28, fontWeight: 'bold' }, 
  cardRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 10, minHeight: 120 },
  slotRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }, 
  emptySlot: { height: 98, borderWidth: 3, borderColor: '#999', borderStyle: 'dashed', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.3)', margin: 2 },
  emptyCardPlaceholder: { height: 112, margin: 2 },
  confirmBtn: { backgroundColor: '#8AC926', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  confirmBtnText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  questionBanner: { backgroundColor: '#FFF3B0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 2, borderColor: '#FFD166', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  questionText: { fontSize: 18, color: '#333', fontWeight: '600' },
  votingPanel: { backgroundColor: 'white', padding: 15, borderRadius: 15, alignItems: 'center', minWidth: 250, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  voteTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  voteRow: { flexDirection: 'row', gap: 10 },
  voteBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 2, borderColor: '#DDD', backgroundColor: '#FAFAFA' },
  voteBtnSelected: { borderWidth: 3 },
  voteBtnText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
  voteBtnTextSelected: { fontWeight: '900' },
  readyText: { color: '#8AC926', fontWeight: 'bold', marginTop: 10 },
  divider: { height: 40, backgroundColor: '#333', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, zIndex: 10 },
  dividerText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  scoreText: { fontWeight: 'bold', fontSize: 20 },
  revealBtn: { backgroundColor: '#FF924C', paddingHorizontal: 20, paddingVertical: 5, borderRadius: 15 },
  revealBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  controlsContainer: { paddingHorizontal: 20, paddingVertical: 10, gap: 10, backgroundColor: '#333' },
  modeBtn: { backgroundColor: '#FF924C', paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  modeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.95)', padding: 10, borderRadius: 15 },
  btn: { backgroundColor: '#1982C4', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 12 }
});