import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const ApplicationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState({});
  const [loginData, setLoginData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("user");
    if (token) {
      setLoginData(JSON.parse(token));
    }
  }, []);

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setResumeFile(file);
    setResumeFileName(file.name);
  };

  const { register, handleSubmit } = useForm({
    defaultValues: {
      applicationStatus: "active",
      applicationForm: [],
      candidateFeedback: [],
    },
  });

  const onSubmit = async (data) => {
    if (!loginData) {
      toast.error("Please login to apply");
      navigate("/login");
      return;
    }

    if (!resumeFile) {
      toast.error("Please upload your resume");
      return;
    }

    setIsSubmitting(true);
    const candidateID = loginData._id;

    const processedForm = [];
    if (data.applicationForm && Array.isArray(data.applicationForm)) {
        for (const item of data.applicationForm) {
            if (item) {
                processedForm.push({
                    question: item.question,
                    answer: Array.isArray(item.answer) ? item.answer.join(', ') : item.answer
                });
            }
        }
    }
    const finalData = { ...data, applicationForm: processedForm };

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/application/post-application`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...finalData, jobID: id, candidateID }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        const appId = result.application?._id || candidateID;

        const formData = new FormData();
        formData.append("file", resumeFile);

        await fetch(
          `${process.env.REACT_APP_API_URL}/upload/resume/${appId}`,
          {
            method: "POST",
            body: formData,
          }
        );

        await fetch(
          `${process.env.REACT_APP_API_URL}/jobs/update-job-by-candidate`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              jobID: id,
              candidateID,
              status: "active",
            }),
          }
        );

        await fetch(
          `${process.env.REACT_APP_API_URL}/users/update-user-by-candidate`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              jobID: id,
              candidateID,
              status: "active",
            }),
          }
        );

        toast.success("Application submitted successfully");
        navigate("/my-jobs");
      } else {
        toast.error(result.message || "Submission failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/jobs/current-job/${id}`)
      .then((res) => res.json())
      .then(setJob)
      .catch(console.error);
  }, [id]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-2">
          Job Application
        </h1>

        {job.jobTitle && (
          <p className="text-center text-neutral-600 dark:text-slate-400 mb-6">
            Applying for{" "}
            <span className="font-semibold text-secondary-600">
              {job.jobTitle}
            </span>
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Resume Upload */}
          <div className="border-2 border-dashed rounded-xl p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={handleResumeChange}
              accept=".pdf,.doc,.docx"
            />

            {resumeFileName ? (
              <>
                <p className="font-medium">{resumeFileName}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="btn-outline mt-3"
                >
                  Change File
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="btn-secondary"
              >
                Upload Resume
              </button>
            )}
          </div>

          {/* Questions */}
          {job.advancedQuestions && job.advancedQuestions.length > 0 ? (
            <div className="space-y-4">
              {job.advancedQuestions.map((q, i) => (
                <RenderAdvancedQuestion
                  key={i}
                  index={i}
                  questionData={q}
                  register={register}
                />
              ))}
            </div>
          ) : job.applicationForm?.question?.length > 0 ? (
            <div className="space-y-4">
              {job.applicationForm.question.map((q, i) => (
                <RenderQuestion
                  key={i}
                  index={i}
                  question={q}
                  register={register}
                />
              ))}
            </div>
          ) : null}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/dash')}
              className="btn-outline"
            >
              Cancel
            </button>

            <button
              disabled={isSubmitting}
              type="submit"
              className="btn-primary"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function RenderQuestion({ index, question, register }) {
  return (
    <div className="border border-neutral-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-800 shadow-sm">
      <p className="font-medium mb-3 text-neutral-900 dark:text-white">
        {index + 1}. {question}
      </p>

      <input
        type="hidden"
        {...register(`applicationForm.${index}.question`)}
        defaultValue={question}
      />

      <div className="flex gap-4">
        <label className="cursor-pointer flex items-center gap-2 text-neutral-700 dark:text-slate-300">
          <input
            type="radio"
            value="Yes"
            {...register(`applicationForm.${index}.answer`, {
              required: true,
            })}
            className="w-4 h-4 text-secondary-600 focus:ring-secondary-500"
          />
          Yes
        </label>

        <label className="cursor-pointer flex items-center gap-2 text-neutral-700 dark:text-slate-300">
          <input
            type="radio"
            value="No"
            {...register(`applicationForm.${index}.answer`, {
              required: true,
            })}
            className="w-4 h-4 text-secondary-600 focus:ring-secondary-500"
          />
          No
        </label>
      </div>
    </div>
  );
}

function RenderAdvancedQuestion({ index, questionData, register }) {
  const { questionType, question, options } = questionData;
  return (
    <div className="border border-neutral-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-800 shadow-sm">
      <p className="font-medium text-lg mb-4 text-neutral-900 dark:text-white">
        {index + 1}. {question} 
        {questionType === 'msq' && <span className="text-xs text-secondary-600 ml-2 font-normal">(Select all that apply)</span>}
      </p>

      <input
        type="hidden"
        {...register(`applicationForm.${index}.question`)}
        defaultValue={question}
      />

      {questionType === 'yes_no' && (
        <div className="flex gap-6">
            <label className="cursor-pointer flex items-center gap-2 text-neutral-700 dark:text-slate-300 p-2 hover:bg-neutral-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <input
                    type="radio"
                    value="Yes"
                    {...register(`applicationForm.${index}.answer`, { required: true })}
                    className="w-4 h-4 text-secondary-600 focus:ring-secondary-500"
                /> Yes
            </label>
            <label className="cursor-pointer flex items-center gap-2 text-neutral-700 dark:text-slate-300 p-2 hover:bg-neutral-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <input
                    type="radio"
                    value="No"
                    {...register(`applicationForm.${index}.answer`, { required: true })}
                    className="w-4 h-4 text-secondary-600 focus:ring-secondary-500"
                /> No
            </label>
        </div>
      )}

      {questionType === 'mcq' && (
        <div className="space-y-2">
            {options && options.map((opt, oIndex) => (
                <label key={oIndex} className="cursor-pointer flex items-center gap-3 text-neutral-700 dark:text-slate-300 p-2 hover:bg-neutral-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <input
                        type="radio"
                        value={opt}
                        {...register(`applicationForm.${index}.answer`, { required: true })}
                        className="w-4 h-4 text-secondary-600 focus:ring-secondary-500"
                    />
                    {opt}
                </label>
            ))}
        </div>
      )}

      {questionType === 'msq' && (
        <div className="space-y-2">
            {options && options.map((opt, oIndex) => (
                <label key={oIndex} className="cursor-pointer flex items-center gap-3 text-neutral-700 dark:text-slate-300 p-2 hover:bg-neutral-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <input
                        type="checkbox"
                        value={opt}
                        {...register(`applicationForm.${index}.answer`, { required: true })}
                        className="w-4 h-4 rounded text-secondary-600 focus:ring-secondary-500"
                    />
                    {opt}
                </label>
            ))}
        </div>
      )}
    </div>
  );
}
