import { useState } from 'react'
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
    Modal,
} from 'react-native'
import { Check, SquaresFour } from 'phosphor-react-native'

import { ScreenLayout } from '../../components/ScreenLayout'
import { ScreenSubtitle } from '../../components/ScreenSubtitle'
import { colors } from '../../styles/colors'
import { getResponsiveScale } from '../../styles/responsive'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import { AddTodoTaskModal } from './components/AddTodoTaskModal'

type TodoCategory = 'College' | 'Work'
type TodoTask = {
    id: string
    title: string
    category: TodoCategory
    isComplete: boolean
}

const initialTasks: TodoTask[] = [
    {
        id: 'college-1',
        title: 'Finish calculator project',
        category: 'College',
        isComplete: false,
    },
    {
        id: 'college-2',
        title: 'Study SOLID principles',
        category: 'College',
        isComplete: false,
    },
    {
        id: 'college-3',
        title: 'Read “Learn Calculus Fast — The Indian Way”',
        category: 'College',
        isComplete: false,
    },
    {
        id: 'college-4',
        title: 'Get an A in the exam',
        category: 'College',
        isComplete: true,
    },
    {
        id: 'work-1',
        title: 'Prepare the weekly report',
        category: 'Work',
        isComplete: false,
    },
    {
        id: 'work-2',
        title: 'Review project feedback',
        category: 'Work',
        isComplete: false,
    },
    {
        id: 'work-3',
        title: 'Plan the next sprint',
        category: 'Work',
        isComplete: true,
    },
]

type TodoScreenProps = {
    isAddTaskModalVisible: boolean
    onCloseAddTaskModal: () => void
}

export const TodoScreen = ({
    isAddTaskModalVisible,
    onCloseAddTaskModal,
}: TodoScreenProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const [tasks, setTasks] = useState(initialTasks)
    const [category, setCategory] = useState<TodoCategory>('College')
    const [isCategoryPickerVisible, setIsCategoryPickerVisible] =
        useState(false)
    const categories: TodoCategory[] = ['College', 'Work']
    const categoryTasks = tasks.filter(task => task.category === category)
    const completedCount = categoryTasks.filter(task => task.isComplete).length
    const progress = categoryTasks.length
        ? Math.round((completedCount / categoryTasks.length) * 100)
        : 0
    const toggleTask = (taskId: string) => {
        setTasks(currentTasks =>
            currentTasks.map(task =>
                task.id === taskId
                    ? { ...task, isComplete: !task.isComplete }
                    : task,
            ),
        )
    }

    const addTask = (title: string) => {
        setTasks(currentTasks => [
            ...currentTasks,
            {
                id: `${category.toLowerCase()}-${Date.now()}`,
                title,
                category,
                isComplete: false,
            },
        ])
    }

    return (
        <ScreenLayout
            title="To-do"
            subtitle={<ScreenSubtitle>Organize your next steps</ScreenSubtitle>}
            userName="Teste da Silva"
            level={7}
            totalPoints={27}
            onProfilePress={() => undefined}
            onMenuPress={() => undefined}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingHorizontal: spacing.lg * scale },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Pressable
                    accessibilityLabel="Choose task category"
                    accessibilityRole="button"
                    onPress={() => setIsCategoryPickerVisible(true)}
                    style={styles.categoryButton}
                >
                    <SquaresFour
                        color={colors.text}
                        size={23}
                        weight="regular"
                    />
                </Pressable>

                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <View>
                            <Text style={styles.progressEyebrow}>PROGRESS</Text>
                            <Text style={styles.progressTitle}>{category}</Text>
                        </View>
                        <Text style={styles.progressPercent}>{progress}%</Text>
                    </View>
                    <View
                        accessibilityLabel={`${progress}% completed`}
                        accessibilityRole="progressbar"
                        style={styles.progressTrack}
                    >
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${progress}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressCaption}>
                        {completedCount} of {categoryTasks.length} tasks
                        completed
                    </Text>
                </View>

                <View style={styles.tasksHeader}>
                    <View>
                        <Text style={styles.tasksTitle}>Your tasks</Text>
                        <Text style={styles.tasksSubtitle}>
                            {categoryTasks.length - completedCount} left to do
                        </Text>
                    </View>
                </View>

                <View style={styles.taskList}>
                    {categoryTasks.length ? (
                        categoryTasks.map((task, index) => (
                            <Pressable
                                accessibilityRole="checkbox"
                                accessibilityState={{
                                    checked: task.isComplete,
                                }}
                                key={task.id}
                                onPress={() => toggleTask(task.id)}
                                style={[
                                    styles.taskRow,
                                    index < categoryTasks.length - 1 &&
                                        styles.taskRowBorder,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        task.isComplete &&
                                            styles.checkboxChecked,
                                    ]}
                                >
                                    {task.isComplete ? (
                                        <Check
                                            color={colors.white}
                                            size={15}
                                            weight="bold"
                                        />
                                    ) : null}
                                </View>
                                <Text
                                    style={[
                                        styles.taskText,
                                        task.isComplete &&
                                            styles.taskTextComplete,
                                    ]}
                                >
                                    {task.title}
                                </Text>
                            </Pressable>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>
                                All clear for now
                            </Text>
                            <Text style={styles.emptyText}>
                                Add a task when something comes up.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
            <AddTodoTaskModal
                category={category}
                isVisible={isAddTaskModalVisible}
                onClose={onCloseAddTaskModal}
                onCreateTask={addTask}
            />
            <Modal
                animationType="fade"
                onRequestClose={() => setIsCategoryPickerVisible(false)}
                transparent
                visible={isCategoryPickerVisible}
            >
                <View style={styles.categoryModalOverlay}>
                    <Pressable
                        accessibilityLabel="Close category picker"
                        onPress={() => setIsCategoryPickerVisible(false)}
                        style={styles.categoryModalBackdrop}
                    />
                    <View style={styles.categoryModal}>
                        <Text style={styles.categoryModalTitle}>
                            Choose a category
                        </Text>
                        {categories.map(item => {
                            const count = tasks.filter(
                                task => task.category === item,
                            ).length
                            const isSelected = category === item

                            return (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        selected: isSelected,
                                    }}
                                    key={item}
                                    onPress={() => {
                                        setCategory(item)
                                        setIsCategoryPickerVisible(false)
                                    }}
                                    style={[
                                        styles.categoryOption,
                                        isSelected &&
                                            styles.categoryOptionSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.categoryOptionText,
                                            isSelected &&
                                                styles.categoryOptionTextSelected,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    <Text style={styles.categoryOptionCount}>
                                        {count} tasks
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </View>
                </View>
            </Modal>
        </ScreenLayout>
    )
}

const styles = StyleSheet.create({
    content: { paddingBottom: spacing.xl, paddingTop: spacing.lg },
    categoryButton: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 14,
        borderWidth: 1,
        height: 48,
        justifyContent: 'center',
        marginBottom: spacing.lg,
        width: 48,
    },
    categoryModalOverlay: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    categoryModalBackdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.62)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    categoryModal: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 20,
        borderWidth: 1,
        padding: spacing.md,
        width: '82%',
    },
    categoryModalTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    categoryOption: {
        alignItems: 'center',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 52,
        paddingHorizontal: spacing.md,
    },
    categoryOptionSelected: { backgroundColor: colors.scheduleCurrent },
    categoryOptionText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '500',
    },
    categoryOptionTextSelected: { color: colors.text },
    categoryOptionCount: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
    },
    progressCard: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: spacing.xl,
        padding: spacing.md,
    },
    progressHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    progressEyebrow: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    progressTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 20,
        fontWeight: '600',
        marginTop: 3,
    },
    progressPercent: {
        color: colors.scheduleBackground,
        fontFamily: typography.fontFamily,
        fontSize: 25,
        fontWeight: '700',
    },
    progressTrack: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 4,
        height: 7,
        overflow: 'hidden',
    },
    progressFill: {
        backgroundColor: colors.scheduleBackground,
        borderRadius: 4,
        height: '100%',
    },
    progressCaption: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: spacing.sm,
    },
    tasksHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    tasksTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 20,
        fontWeight: '600',
    },
    tasksSubtitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 2,
    },
    taskList: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: spacing.sm,
        overflow: 'hidden',
    },
    taskRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 66,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    taskRowBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 },
    checkbox: {
        alignItems: 'center',
        borderColor: colors.textMuted,
        borderRadius: 6,
        borderWidth: 1.5,
        height: 23,
        justifyContent: 'center',
        width: 23,
    },
    checkboxChecked: {
        backgroundColor: colors.scheduleBackground,
        borderColor: colors.scheduleBackground,
    },
    taskText: {
        color: colors.text,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        lineHeight: 20,
    },
    taskTextComplete: {
        color: colors.textMuted,
        textDecorationLine: 'line-through',
    },
    emptyState: { alignItems: 'center', padding: spacing.xl },
    emptyTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        fontWeight: '600',
    },
    emptyText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
})
