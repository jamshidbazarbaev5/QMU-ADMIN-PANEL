import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { TranslatedForm } from "../helpers/TranslatedForm";
// import { fetchWithAuth, getAuthHeader } from "../api/api";
import api2 from "../api/api2";
import { Input } from "../components/ui/input";

type Language = "en" | "ru" | "uz" | "kk";

interface Translation {
  title: string;
  description: string;
  slug: string;
}

interface Announcement {
  id: number;
  date_post: string;
  translations: {
    [key in Language]?: Translation;
  };
}

const formatDateForServer = (date: string, time: string) => {
  // Create date object in local timezone
  const localDate = new Date(`${date}T${time}`);
  // Convert to UTC
  return localDate.toISOString();
}

const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toISOString().split('T')[0],
    time: date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }
}

export default function EditAnnouncement() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [layoutLanguage, setLayoutLanguage] = useState<Language>(() => {
    return (localStorage.getItem("language") as Language) || "ru";
  });
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dateTime, setDateTime] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit'
    })
  });

  const fields = [
    {
      name: "title",
      label: "Title",
      type: "text" as const,
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "richtext" as const,
      required: true,
    },
  ];

  const languages: Language[] = ["ru", "en", "uz", "kk"];

  // Initial fetch when component mounts
  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!slug) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `https://karsu.uz/api/announcements/${slug}/`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch announcement");
        }

        const data: Announcement = await response.json();
        setAnnouncement(data);
        
        if (data.date_post) {
          const { date, time } = formatDateForInput(data.date_post);
          setDateTime({ date, time });
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
        alert("Failed to fetch announcement");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncement();
  }, [slug, layoutLanguage]);

  // Listen for language changes from layout
  useEffect(() => {
    const handleStorageChange = () => {
      const newLanguage = localStorage.getItem("language") as Language;
      if (newLanguage && newLanguage !== layoutLanguage) {
        setLayoutLanguage(newLanguage);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [layoutLanguage]);

  // Transform announcement data for TranslatedForm
  const getInitialData = () => {
    if (!announcement) return {};

    const initialData: {
      [key: string]: { title: string; description: string };
    } = {};

    Object.entries(announcement.translations).forEach(([lang, translation]) => {
      if (translation) {
        initialData[lang] = {
          title: translation.title,
          description: translation.description,
        };
      }
    });

    return initialData;
  };

  async function onSubmit(formData: any) {
    try {
      if (!announcement || !slug) return;


      // Process each language's form data
      const translations: Record<string, { title: string; description: string; slug: string }> = {};
      
      ['ru', 'en', 'uz', 'kk'].forEach(lang => {
        const title = formData[`title_${lang}`]?.trim();
        const description = formData[`description_${lang}`]?.trim();
        
        if (title || description) {
          const newSlug = title
            ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
            : '';
            
          translations[lang] = {
            title: title || '',
            description: description || '',
            slug: newSlug
          };
        }
      });

      // Create form data for submission
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('translations', JSON.stringify(translations));
      
      // Format and append date_post
      const dateTime = formatDateForServer(formData.date, formData.time);
      formDataToSubmit.append('date_post', dateTime);

      const response = await api2.put(
        `https://karsu.uz/api/announcements/${slug}/`,
        formDataToSubmit
      );

      if (!response) {
        throw new Error("Failed to update announcement");
      }

      navigate('/karsu-new-admin-panel/annoucment-list')
    } catch (error) {
      console.error("Error updating announcement:", error);
      alert("Failed to update announcement");
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C5DD3]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Announcement #{announcement?.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                type="date"
                value={dateTime.date}
                onChange={(e) => {
                  setDateTime(prev => ({
                    ...prev,
                    date: e.target.value
                  }))
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <Input
                type="time"
                value={dateTime.time}
                onChange={(e) => {
                  setDateTime(prev => ({
                    ...prev,
                    time: e.target.value
                  }))
                }}
              />
            </div>
          </div>

          <TranslatedForm
            fields={fields}
            languages={languages}
            onSubmit={onSubmit}
            initialData={getInitialData()}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
