/**
 * Verify Mnemonic Screen - 니모닉 확인 퀴즈
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { walletService } from '../../services/wallet/WalletService';
import { Button } from '../../components/Button';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyMnemonic'>;
type RouteProps = RouteProp<RootStackParamList, 'VerifyMnemonic'>;

interface QuizQuestion {
  wordIndex: number;
  options: string[];
  correctAnswer: string;
}

export const VerifyMnemonicScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { mnemonic } = route.params;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = () => {
    const words = walletService.mnemonicToWords(mnemonic);

    // 3개의 랜덤 위치 선택
    const positions = [2, 5, 9]; // 3번째, 6번째, 10번째 단어
    const quizQuestions: QuizQuestion[] = positions.map((pos) => {
      const correctWord = words[pos];

      // 다른 단어들 중에서 3개 선택 (오답)
      const otherWords = words.filter((_, i) => i !== pos);
      const shuffled = otherWords.sort(() => Math.random() - 0.5);
      const wrongOptions = shuffled.slice(0, 3);

      // 정답과 오답을 섞음
      const options = [...wrongOptions, correctWord].sort(() => Math.random() - 0.5);

      return {
        wordIndex: pos,
        options,
        correctAnswer: correctWord,
      };
    });

    setQuestions(quizQuestions);
  };

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    const question = questions[currentQuestion];
    const correct = answer === question.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
          setSelectedAnswer(null);
          setIsCorrect(null);
        } else {
          // 모든 문제 완료 - PIN 설정으로 이동
          navigation.navigate('SetupPin', {
            isNewWallet: true,
            mnemonic,
          });
        }
      }, 500);
    }
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  if (questions.length === 0) {
    return null;
  }

  const question = questions[currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progress}>
          {questions.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index < currentQuestion && styles.progressDotCompleted,
                index === currentQuestion && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.header}>
          <Text style={styles.icon}>🧩</Text>
          <Text style={styles.title}>Verify Backup</Text>
          <Text style={styles.subtitle}>
            Select word #{question.wordIndex + 1} from your recovery phrase
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const showCorrect = isCorrect === false && option === question.correctAnswer;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  isSelected && (isCorrect ? styles.optionCorrect : styles.optionWrong),
                  showCorrect && styles.optionCorrect,
                ]}
                onPress={() => !selectedAnswer && handleSelectAnswer(option)}
                disabled={selectedAnswer !== null}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isCorrect === false && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Incorrect! The correct word was "{question.correctAnswer}"
            </Text>
            <Button
              title="Try Again"
              onPress={handleRetry}
              variant="outline"
              size="small"
            />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Question {currentQuestion + 1} of {questions.length}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#34C759',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
  },
  optionsContainer: {
    marginTop: 24,
  },
  option: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#34C759',
  },
  optionWrong: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF3B30',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#1C1C1E',
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default VerifyMnemonicScreen;
